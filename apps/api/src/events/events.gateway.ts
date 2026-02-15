import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { PubSubService } from '../pubsub';
import { WorkflowRunsService } from '../workflow-runs';
import { WorkflowsService } from '../workflows';
import { LlmContextService } from '../llm-context';
import { StoreSyncService } from './store-sync.service';
import { ChatUploadsService } from '../chat-uploads';
import { MedusaService } from '../medusa/medusa.service';

interface WorkflowMessage {
  id: string;
  type: string;
  workflow_run_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

const WORKFLOW_CHANNEL_PREFIX = process.env.WORKFLOW_CHANNEL_PREFIX || 'workflow';

@WebSocketGateway({
  cors: {
    origin: process.env.API_CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  path: '/ws',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly pubsub: PubSubService,
    private readonly workflowRunsService: WorkflowRunsService,
    private readonly workflowsService: WorkflowsService,
    private readonly llmContext: LlmContextService,
    private readonly storeSync: StoreSyncService,
    private readonly chatUploads: ChatUploadsService,
    private readonly medusaService: MedusaService,
  ) {}

  async afterInit() {
    this.storeSync.setServer(this.server);
    await this.pubsub.subscribe(`${WORKFLOW_CHANNEL_PREFIX}:*`, (channel, message) => {
      this.handleWorkflowMessage(channel, message as WorkflowMessage);
    });
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]*)/);
    if (match) {
      client.data.authToken = match[1];
    }
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private requireClientAuth(client: Socket): void {
    if (!client.data.authToken) {
      throw new Error('Not authenticated');
    }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    try {
      this.requireClientAuth(client);
      if (!room || typeof room !== 'string') return { error: 'Invalid room' };
      client.join(room);
      this.logger.log(`Client ${client.id} joined room: ${room}`);
      return { event: 'joined', room };
    } catch (e: any) {
      this.logger.warn(`handleJoin failed for ${client.id}: ${e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('leave')
  handleLeave(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    try {
      this.requireClientAuth(client);
      if (!room || typeof room !== 'string') return { error: 'Invalid room' };
      client.leave(room);
      this.logger.log(`Client ${client.id} left room: ${room}`);
      return { event: 'left', room };
    } catch (e: any) {
      this.logger.warn(`handleLeave failed for ${client.id}: ${e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { room: string; message: unknown },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!data?.room || typeof data.room !== 'string') return { error: 'Invalid room' };
      client.to(data.room).emit('message', {
        from: client.id,
        message: data.message,
      });
      return { event: 'message_sent', room: data.room };
    } catch (e: any) {
      this.logger.warn(`handleMessage failed for ${client.id}: ${e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('vendor:join')
  handleVendorJoin(
    @MessageBody() payload: { vendor_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.vendor_id || typeof payload.vendor_id !== 'string') return { error: 'Invalid vendor_id' };
      client.join(`vendor:${payload.vendor_id}`);
      this.logger.log(`Client ${client.id} joined vendor room: ${payload.vendor_id}`);
      return { event: 'vendor:joined', vendor_id: payload.vendor_id };
    } catch (e: any) {
      this.logger.warn(`handleVendorJoin failed for ${client.id}: ${e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('vendor:leave')
  handleVendorLeave(
    @MessageBody() payload: { vendor_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.vendor_id || typeof payload.vendor_id !== 'string') return { error: 'Invalid vendor_id' };
      client.leave(`vendor:${payload.vendor_id}`);
      this.logger.log(`Client ${client.id} left vendor room: ${payload.vendor_id}`);
      return { event: 'vendor:left', vendor_id: payload.vendor_id };
    } catch (e: any) {
      this.logger.warn(`handleVendorLeave failed for ${client.id}: ${e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('workflow:join')
  async handleWorkflowJoin(
    @MessageBody() payload: { workflow_run_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.workflow_run_id || typeof payload.workflow_run_id !== 'string') {
        return { error: 'Invalid workflow_run_id' };
      }
      const { workflow_run_id } = payload;

      const exists = await this.workflowRunsService.exists(workflow_run_id);
      if (!exists) {
        client.emit('workflow:error', {
          workflow_run_id,
          payload: {
            message: 'Workflow run not found. Create a workflow run first via REST API.',
            code: 'WORKFLOW_RUN_NOT_FOUND',
          },
        });
        return { error: 'WORKFLOW_RUN_NOT_FOUND' };
      }

      const [thinkingContent, textContent, processingFlag] = await Promise.all([
        this.pubsub.getBuffer(`stream:${workflow_run_id}:thinking`),
        this.pubsub.getBuffer(`stream:${workflow_run_id}:text`),
        this.pubsub.getKey(`processing:${workflow_run_id}`),
      ]);

      const pendingInteraction =
        await this.workflowRunsService.getPendingInteraction(workflow_run_id);

      const roomName = `workflow:${workflow_run_id}`;
      await client.join(roomName);

      const isProcessing = !!(thinkingContent || textContent || processingFlag);

      client.emit('workflow:joined', {
        workflow_run_id,
        catch_up:
          isProcessing || pendingInteraction
            ? { isProcessing, pendingInteraction }
            : null,
      });

      this.logger.log(`Client ${client.id} joined workflow run: ${workflow_run_id}`);
      return { workflow_run_id };
    } catch (e: any) {
      this.logger.error(`handleWorkflowJoin failed for ${client.id}: ${e.stack || e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('workflow:leave')
  async handleWorkflowLeave(
    @MessageBody() payload: { workflow_run_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.workflow_run_id) return { error: 'Invalid workflow_run_id' };
      const roomName = `workflow:${payload.workflow_run_id}`;
      await client.leave(roomName);
      this.logger.log(`Client ${client.id} left workflow run: ${payload.workflow_run_id}`);
      return { left: payload.workflow_run_id };
    } catch (e: any) {
      this.logger.error(`handleWorkflowLeave failed for ${client.id}: ${e.stack || e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('workflow:user_message')
  async handleWorkflowUserMessage(
    @MessageBody()
    payload: {
      workflow_run_id: string;
      content: string;
      context?: Record<string, unknown>;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.workflow_run_id || !payload?.content) {
        client.emit('workflow:error', { workflow_run_id: payload?.workflow_run_id, payload: { message: 'workflow_run_id and content are required', code: 'INVALID_INPUT' } });
        return;
      }
      const { workflow_run_id, content, context: clientContext } = payload;

      const exists = await this.workflowRunsService.exists(workflow_run_id);
      if (!exists) {
        client.emit('workflow:error', {
          workflow_run_id,
          payload: {
            message: 'Workflow run not found.',
            code: 'WORKFLOW_RUN_NOT_FOUND',
          },
        });
        return;
      }

      let workflowDefinition: Record<string, unknown> | null = null;

      if (clientContext?.workflow_override) {
        workflowDefinition = clientContext.workflow_override as Record<string, unknown>;
      } else if (clientContext?.workflowId) {
        try {
          const workflow = await this.workflowsService.findOne(
            clientContext.workflowId as string,
          );
          workflowDefinition = workflow.definition as Record<string, unknown>;
        } catch {
          client.emit('workflow:error', {
            workflow_run_id,
            payload: {
              message: 'Workflow not found.',
              code: 'WORKFLOW_NOT_FOUND',
            },
          });
          return;
        }
      }

      if (!workflowDefinition) {
        client.emit('workflow:error', {
          workflow_run_id,
          payload: {
            message: 'No workflow provided. Send workflow_override or workflowId in context.',
            code: 'NO_WORKFLOW',
          },
        });
        return;
      }

      const workflowRun = await this.workflowRunsService.findOne(workflow_run_id);

      const enrichedContext = await this.llmContext.buildContext(
        workflowRun.vendorId,
        clientContext,
      );

      if (client.data.authToken) {
        await this.workflowRunsService.storeAuthToken(workflow_run_id, client.data.authToken);
      }

      delete enrichedContext.workflow_override;
      delete enrichedContext.workflowId;

      const agentHistory =
        (workflowRun.agentHistory as Record<string, unknown[]>) || {};

      const incomingAttachments = enrichedContext.attachments as Array<Record<string, unknown>> | undefined;
      const attachmentDtos = incomingAttachments?.map((a) => ({
        url: (a.url as string) || '',
        filename: (a.filename as string) || 'file',
        mimeType: (a.mimeType as string) || 'application/octet-stream',
        source: 'user' as const,
      }));
      delete enrichedContext.attachments;

      await this.workflowRunsService.addMessage(
        workflow_run_id,
        { role: 'user', type: 'user_message', content },
        attachmentDtos,
      );

      const workflowPayload = {
        type: 'workflow',
        workflow: workflowDefinition,
        content,
        attachments: attachmentDtos || [],
        context: enrichedContext,
        history: agentHistory,
      };

      const message: WorkflowMessage = {
        id: uuidv4(),
        type: 'workflow',
        workflow_run_id,
        timestamp: new Date().toISOString(),
        payload: workflowPayload,
      };

      await this.pubsub.setKey(`processing:${workflow_run_id}`, '1', 1800);
      await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, message);
      this.logger.log(`Published workflow for run: ${workflow_run_id}`);

      const isFirstMessage = !workflowRun.messages || workflowRun.messages.length === 0;
      if (isFirstMessage && content) {
        const titleRunId = `title:${workflow_run_id}`;
        const titleWorkflow: WorkflowMessage = {
          id: uuidv4(),
          type: 'workflow',
          workflow_run_id: titleRunId,
          timestamp: new Date().toISOString(),
          payload: {
            type: 'workflow',
            workflow: {
              name: 'title-generator',
              description: 'Generate a short title for a conversation',
              agents: {
                titler: {
                  description: 'Generates concise conversation titles',
                  system_prompt:
                    'Generate a short, descriptive title (max 6 words) for a conversation that starts with this message. Return ONLY the title text, nothing else. No quotes, no punctuation at the end.',
                  model: 'anthropic/claude-3.5-haiku',
                  output_schema: { type: 'string' },
                },
              },
              steps: [{ id: 'generate', agent: 'titler' }],
              output: '${{ steps.generate.output }}',
            },
            content,
          },
        };
        await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${titleRunId}`, titleWorkflow);
        this.logger.log(`Triggered title generation workflow for run: ${workflow_run_id}`);
      }
    } catch (e: any) {
      this.logger.error(`handleWorkflowUserMessage failed for ${client.id}: ${e.stack || e.message}`);
      client.emit('workflow:error', { workflow_run_id: payload?.workflow_run_id, payload: { message: e.message, code: 'INTERNAL_ERROR' } });
    }
  }

  @SubscribeMessage('workflow:tool_response')
  async handleWorkflowToolResponse(
    @MessageBody()
    payload: {
      workflow_run_id: string;
      callback_id: string;
      data?: Record<string, unknown>;
      error?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.workflow_run_id || !payload?.callback_id) return { error: 'workflow_run_id and callback_id are required' };
      const { workflow_run_id, callback_id, data, error } = payload;

      const message: WorkflowMessage = {
        id: uuidv4(),
        type: 'tool_response',
        workflow_run_id,
        timestamp: new Date().toISOString(),
        payload: { callback_id, data, error },
      };

      await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, message);
      this.logger.log(`Published tool_response for callback: ${callback_id}`);
    } catch (e: any) {
      this.logger.error(`handleWorkflowToolResponse failed for ${client.id}: ${e.stack || e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('workflow:cancel')
  async handleWorkflowCancel(
    @MessageBody() payload: { workflow_run_id: string; task_id?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.workflow_run_id) return { error: 'workflow_run_id is required' };
      const { workflow_run_id, task_id } = payload;

      const message: WorkflowMessage = {
        id: uuidv4(),
        type: 'cancel',
        workflow_run_id,
        timestamp: new Date().toISOString(),
        payload: { task_id },
      };

      await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, message);
      this.logger.log(`Published cancel for workflow run: ${workflow_run_id}`);
    } catch (e: any) {
      this.logger.error(`handleWorkflowCancel failed for ${client.id}: ${e.stack || e.message}`);
      return { error: e.message };
    }
  }

  @SubscribeMessage('workflow:clarification_response')
  async handleClarificationResponse(
    @MessageBody()
    payload: {
      workflow_run_id: string;
      callback_id: string;
      answers: Record<string, string | string[]>;
      questions?: Array<{
        id: string;
        prompt: string;
        options: Array<{ id: string; label: string }>;
        allow_multiple?: boolean;
      }>;
      context?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.requireClientAuth(client);
      if (!payload?.workflow_run_id || !payload?.callback_id) return { error: 'workflow_run_id and callback_id are required' };
      const { workflow_run_id, callback_id, answers, questions, context } = payload;

      await this.workflowRunsService.addMessage(workflow_run_id, {
        role: 'user',
        type: 'clarification_response',
        content: '',
        data: { context, questions, answers },
      });

      const response: WorkflowMessage = {
        id: uuidv4(),
        type: 'callback_response',
        workflow_run_id,
        timestamp: new Date().toISOString(),
        payload: {
          callback_id,
          data: { answers },
        },
      };

      await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, response);
      this.logger.log(`Published clarification_response for callback: ${callback_id}`);
    } catch (e: any) {
      this.logger.error(`handleClarificationResponse failed for ${client?.id}: ${e.stack || e.message}`);
      return { error: e.message };
    }
  }

  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  broadcastToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  private async handleAttachmentsQuery(message: WorkflowMessage) {
    try {
      const { workflow_run_id } = message;
      const filter = message.payload.filter as string | number | undefined;
      let parsedFilter: 'latest' | 'all' | number = 'all';
      if (filter === 'latest') parsedFilter = 'latest';
      else if (typeof filter === 'number') parsedFilter = filter;
      else if (typeof filter === 'string' && !isNaN(Number(filter))) parsedFilter = Number(filter);

      const attachments = await this.workflowRunsService.getAttachments(workflow_run_id, parsedFilter);

      const callbackId = message.payload.callback_id as string;
      if (callbackId) {
        const response: WorkflowMessage = {
          id: uuidv4(),
          type: 'callback_response',
          workflow_run_id,
          timestamp: new Date().toISOString(),
          payload: { callback_id: callbackId, data: { attachments } },
        };
        await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, response);
      }
    } catch (e) {
      this.logger.error(`Failed to handle attachments query: ${e}`);
    }
  }

  private async handleViewImages(message: WorkflowMessage) {
    try {
      const { workflow_run_id } = message;
      const ids = message.payload.attachment_ids as string[];
      const results: Array<Record<string, unknown>> = [];

      const attachments = await this.workflowRunsService.getAttachmentsByIds(ids);
      for (const id of ids) {
        const att = attachments.find((a) => a.id === id);
        if (!att) { results.push({ id, error: 'not found' }); continue; }

        const uploadId = att.url.replace('/api/chat-uploads/', '');
        const filePath = this.chatUploads.getFilePath(uploadId);
        if (!filePath) { results.push({ id, error: 'file not found on disk' }); continue; }

        const buffer = await fs.promises.readFile(filePath);
        const base64 = buffer.toString('base64');
        const redisKey = `image:${workflow_run_id}:${id}`;
        await this.pubsub.setKey(redisKey, base64, 300);

        results.push({
          id, filename: att.filename, mimeType: att.mimeType,
          redisKey,
        });
      }

      const callbackId = message.payload.callback_id as string;
      if (callbackId) {
        const response: WorkflowMessage = {
          id: uuidv4(),
          type: 'callback_response',
          workflow_run_id,
          timestamp: new Date().toISOString(),
          payload: { callback_id: callbackId, data: { images: results } },
        };
        await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, response);
      }
    } catch (e) {
      this.logger.error(`Failed to handle view_images: ${e}`);
    }
  }

  private async handleViewProductImages(message: WorkflowMessage) {
    try {
      const { workflow_run_id } = message;
      const storeId = message.payload.store_id as string;
      const productId = message.payload.product_id as string;
      const imageIds = message.payload.image_ids as string[] | undefined;

      const token = await this.workflowRunsService.getAuthToken(workflow_run_id);
      if (!token) {
        throw new Error('No auth token found for workflow run');
      }

      const productResult = await this.medusaService.getProducts(token, storeId, { id: [productId] });
      let images = productResult.products?.[0]?.images || [];

      if (imageIds && imageIds.length > 0) {
        images = images.filter((img: any) => imageIds.includes(img.id));
      }

      const results: Array<Record<string, unknown>> = [];

      for (const img of images) {
        try {
          const response = await fetch(img.url);
          if (!response.ok) {
            results.push({ id: img.id, error: 'failed to fetch image' });
            continue;
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64 = buffer.toString('base64');
          const redisKey = `product-image:${workflow_run_id}:${img.id}`;
          await this.pubsub.setKey(redisKey, base64, 300);

          const contentType = response.headers.get('content-type') || 'image/png';
          results.push({
            id: img.id,
            filename: img.url.split('/').pop() || 'image',
            mimeType: contentType,
            redisKey,
          });
        } catch (e) {
          results.push({ id: img.id, error: `fetch error: ${e}` });
        }
      }

      const callbackId = message.payload.callback_id as string;
      if (callbackId) {
        const response: WorkflowMessage = {
          id: uuidv4(),
          type: 'callback_response',
          workflow_run_id,
          timestamp: new Date().toISOString(),
          payload: { callback_id: callbackId, data: { images: results } },
        };
        await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, response);
      }
    } catch (e) {
      this.logger.error(`Failed to handle view_product_images: ${e}`);
    }
  }

  private async handleAgentAttachment(message: WorkflowMessage) {
    try {
      const { workflow_run_id } = message;
      const attachment = message.payload.attachment as Record<string, unknown>;
      if (!attachment) return;

      let id: string;
      let filename = (attachment.filename as string) || 'file';

      if (attachment.b64_data) {
        const result = await this.chatUploads.storeFromBase64(attachment.b64_data as string, filename);
        id = result.id;
        filename = result.filename;
      } else if (attachment.external_url) {
        const result = await this.chatUploads.storeFromUrl(attachment.external_url as string, filename);
        id = result.id;
        filename = result.filename;
      } else {
        this.logger.warn('Agent attachment has no b64_data or external_url');
        return;
      }

      const url = this.chatUploads.buildUrl(id);
      const mimeType = (attachment.mimeType as string) || 'application/octet-stream';

      const msg = await this.workflowRunsService.addMessage(
        workflow_run_id,
        { role: 'assistant', type: 'attachment', content: '' },
        [{ url, filename, mimeType, source: 'agent' }],
      );

      const attachmentId = msg.attachments[0]?.id || id;

      const roomName = `workflow:${workflow_run_id}`;
      this.server.to(roomName).emit('workflow:attachment', {
        workflow_run_id,
        attachment: { id: attachmentId, url, filename, mimeType, source: 'agent' },
      });

      const callbackId = message.payload.callback_id as string;
      if (callbackId) {
        const response: WorkflowMessage = {
          id: uuidv4(),
          type: 'callback_response',
          workflow_run_id,
          timestamp: new Date().toISOString(),
          payload: { callback_id: callbackId, data: { id: attachmentId, url, filename } },
        };
        await this.pubsub.publish(`${WORKFLOW_CHANNEL_PREFIX}:${workflow_run_id}`, response);
      }
    } catch (e) {
      this.logger.error(`Failed to handle agent attachment: ${e}`);
    }
  }

  private async flushStreamBuffers(
    runId: string,
    textOverride?: { content: string; data?: Record<string, unknown> },
  ): Promise<{ thinking: string | null; text: string | null }> {
    const thinkingKey = `stream:${runId}:thinking`;
    const textKey = `stream:${runId}:text`;

    const [thinkingContent, textContent] = await Promise.all([
      this.pubsub.getBuffer(thinkingKey),
      this.pubsub.getBuffer(textKey),
    ]);

    if (thinkingContent) {
      await this.workflowRunsService.addMessage(runId, {
        role: 'assistant',
        type: 'thinking',
        content: thinkingContent,
      });
    }

    const finalText = textOverride?.content || textContent;
    if (finalText) {
      await this.workflowRunsService.addMessage(runId, {
        role: 'assistant',
        type: 'text_delta',
        content: finalText,
        data: textOverride?.data,
      });
    }

    await this.pubsub.deleteBuffers(thinkingKey, textKey);

    return {
      thinking: thinkingContent || null,
      text: finalText || null,
    };
  }

  private async handleWorkflowMessage(channel: string, message: WorkflowMessage) {
    if (message.workflow_run_id.startsWith('title:')) {
      if (message.type === 'end_of_turn') {
        const realRunId = message.workflow_run_id.replace('title:', '');
        const output = (message.payload?.data as Record<string, unknown>)?.output as Record<string, unknown> | undefined;
        const title = ((output?.response as string) || '').trim().slice(0, 60);
        if (title) {
          try {
            await this.workflowRunsService.updateTitle(realRunId, title);
            const roomName = `workflow:${realRunId}`;
            this.server.to(roomName).emit('workflow:title_updated', {
              workflow_run_id: realRunId,
              title,
            });
            this.logger.log(`Title generated for ${realRunId}: ${title}`);
          } catch (e) {
            this.logger.error(`Failed to save title for ${realRunId}: ${e}`);
          }
        }
      }
      return;
    }

    if (message.type === 'workflow:attachments_query') {
      await this.handleAttachmentsQuery(message);
      return;
    }

    if (message.type === 'workflow:view_images') {
      await this.handleViewImages(message);
      return;
    }

    if (message.type === 'workflow:view_product_images') {
      await this.handleViewProductImages(message);
      return;
    }

    if (message.type === 'workflow:attachment') {
      await this.handleAgentAttachment(message);
      return;
    }

    if (message.payload?.callback_id && message.type.startsWith('workflow:')) {
      const runId = message.workflow_run_id;
      const roomName = `workflow:${runId}`;

      const flushed = await this.flushStreamBuffers(runId);

      await this.workflowRunsService.addMessage(runId, {
        role: 'assistant',
        type: message.type,
        content: '',
        data: {
          callback_id: message.payload.callback_id,
          ...message.payload,
        },
      });

      message.payload.flushed = flushed;
      this.server.to(roomName).emit(message.type, message);
      return;
    }

    const outboundTypes = [
      'thinking',
      'text_delta',
      'end_of_turn',
      'error',
    ];

    if (!outboundTypes.includes(message.type)) {
      return;
    }

    if (message.type === 'thinking') {
      const content = (message.payload.content as string) || '';
      if (content) {
        try {
          await this.pubsub.appendBuffer(
            `stream:${message.workflow_run_id}:thinking`,
            content,
          );
        } catch (e) {
          this.logger.error(`Failed to buffer thinking: ${e}`);
        }
      }
    }

    if (message.type === 'text_delta') {
      const content = (message.payload.content as string) || '';
      if (content) {
        try {
          await this.pubsub.appendBuffer(
            `stream:${message.workflow_run_id}:text`,
            content,
          );
        } catch (e) {
          this.logger.error(`Failed to buffer text_delta: ${e}`);
        }
      }
    }

    if (message.type === 'end_of_turn' || message.type === 'error') {
      const payloadSize = JSON.stringify(message.payload).length;
      this.logger.log(
        `Processing ${message.type} for ${message.workflow_run_id} (payload: ${(payloadSize / 1024).toFixed(1)}KB)`,
      );
      try {
        const runId = message.workflow_run_id;
        const data = message.payload.data as Record<string, unknown> | undefined;
        const output = data?.output as Record<string, unknown> | undefined;
        const finalResponse = output?.response as string | null ?? null;

        const textOverride = finalResponse
          ? { content: finalResponse, data: data ? { output: data.output } : undefined }
          : undefined;
        this.logger.debug(`Flushing stream buffers for ${runId}`);
        const flushed = await this.flushStreamBuffers(runId, textOverride);
        this.logger.debug(`Stream buffers flushed for ${runId}`);

        const history = data?.history as Record<string, unknown[]> | undefined;

        if (history && Object.keys(history).length > 0) {
          const historySize = JSON.stringify(history).length;
          this.logger.log(
            `Saving agent history for ${runId} (${Object.keys(history).length} groups, ${(historySize / 1024).toFixed(1)}KB)`,
          );
          await this.workflowRunsService.updateAgentHistory(runId, history);
          this.logger.debug(`Agent history saved for ${runId}`);
        }

        const isError = message.type === 'error';
        await this.workflowRunsService.addMessage(runId, {
          role: 'assistant',
          type: message.type,
          content: isError
            ? (message.payload.message as string) || ''
            : '',
          data: data ? { output: data.output } : undefined,
        });
        this.logger.debug(`Message persisted for ${runId}`);

        message.payload.flushed = flushed;
        await this.pubsub.deleteKey(`processing:${runId}`);
      } catch (e) {
        this.logger.error(`Failed to persist on ${message.type} for ${message.workflow_run_id}: ${e}`);
      }
    }

    const roomName = `workflow:${message.workflow_run_id}`;
    this.server.to(roomName).emit(`workflow:${message.type}`, message);

    this.logger.log(`Forwarded workflow:${message.type} to room: ${roomName}`);
  }
}
