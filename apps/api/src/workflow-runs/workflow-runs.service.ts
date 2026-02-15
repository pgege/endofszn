import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common';
import { CreateWorkflowRunDto, CreateMessageDto } from './dto';

export interface CreateAttachmentDto {
  url: string;
  filename: string;
  mimeType: string;
  source: 'user' | 'agent';
}

@Injectable()
export class WorkflowRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowRunDto) {
    try {
      return await this.prisma.workflowRun.create({
        data: {
          vendorId: dto.vendorId,
          workflowId: dto.workflowId,
        },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to create workflow run: ${error.message}`, { operation: 'create_workflow_run' });
    }
  }

  async findAllByVendor(vendorId: string, workflowId?: string) {
    try {
      return await this.prisma.workflowRun.findMany({
        where: {
          vendorId,
          ...(workflowId && { workflowId }),
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { attachments: true },
          },
        },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to list workflow runs: ${error.message}`, { operation: 'list_workflow_runs', vendorId });
    }
  }

  async findOne(id: string) {
    try {
      const workflowRun = await this.prisma.workflowRun.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: { attachments: true },
          },
        },
      });

      if (!workflowRun) {
        throw ApiException.notFound(`Workflow run ${id} not found`, { operation: 'find_workflow_run', id });
      }

      return workflowRun;
    } catch (error: any) {
      if (error instanceof ApiException) throw error;
      throw ApiException.internal(`Failed to find workflow run: ${error.message}`, { operation: 'find_workflow_run', id });
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const workflowRun = await this.prisma.workflowRun.findUnique({
        where: { id },
        select: { id: true },
      });
      return !!workflowRun;
    } catch (error: any) {
      throw ApiException.internal(`Failed to check workflow run existence: ${error.message}`, { operation: 'exists', id });
    }
  }

  async getAgentHistory(
    id: string,
  ): Promise<Record<string, unknown[]> | null> {
    try {
      const workflowRun = await this.prisma.workflowRun.findUnique({
        where: { id },
        select: { agentHistory: true },
      });
      return (workflowRun?.agentHistory as Record<string, unknown[]>) || null;
    } catch (error: any) {
      throw ApiException.internal(`Failed to get agent history: ${error.message}`, { operation: 'get_agent_history', id });
    }
  }

  async updateAgentHistory(
    id: string,
    history: Record<string, unknown[]>,
  ): Promise<void> {
    try {
      const existing = await this.getAgentHistory(id);
      const merged = { ...(existing || {}), ...history };
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          agentHistory: merged as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      if (error instanceof ApiException) throw error;
      throw ApiException.internal(`Failed to update agent history: ${error.message}`, { operation: 'update_agent_history', id });
    }
  }

  async addMessage(
    workflowRunId: string,
    dto: CreateMessageDto,
    attachments?: CreateAttachmentDto[],
  ) {
    try {
      await this.prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: { updatedAt: new Date() },
      });

      return await this.prisma.message.create({
        data: {
          workflowRunId,
          role: dto.role,
          type: dto.type,
          content: dto.content,
          data: dto.data as Prisma.InputJsonValue | undefined,
          ...(attachments && attachments.length > 0
            ? {
                attachments: {
                  create: attachments.map((a) => ({
                    url: a.url,
                    filename: a.filename,
                    mimeType: a.mimeType,
                    source: a.source,
                  })),
                },
              }
            : {}),
        },
        include: { attachments: true },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to add message: ${error.message}`, { operation: 'add_message', workflowRunId });
    }
  }

  async createAttachmentOnMessage(
    messageId: string,
    attachment: CreateAttachmentDto,
  ) {
    try {
      return await this.prisma.attachment.create({
        data: {
          messageId,
          url: attachment.url,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          source: attachment.source,
        },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to create attachment: ${error.message}`, { operation: 'create_attachment', messageId });
    }
  }

  async getAttachments(
    workflowRunId: string,
    filter?: 'latest' | 'all' | number,
  ): Promise<Array<Record<string, unknown>>> {
    try {
      if (filter === 'latest') {
        const latestMessage = await this.prisma.message.findFirst({
          where: {
            workflowRunId,
            attachments: { some: {} },
          },
          orderBy: { createdAt: 'desc' },
          include: { attachments: true },
        });
        if (!latestMessage) return [];
        return latestMessage.attachments.map((a) => ({
          id: a.id,
          url: a.url,
          filename: a.filename,
          mimeType: a.mimeType,
          source: a.source,
          createdAt: a.createdAt.toISOString(),
        }));
      }

      const allAttachments = await this.prisma.attachment.findMany({
        where: { message: { workflowRunId } },
        orderBy: { createdAt: 'asc' },
      });

      if (filter !== undefined && filter !== null && filter !== 'all') {
        const index = typeof filter === 'number' ? filter : parseInt(String(filter), 10);
        if (!isNaN(index) && index >= 0 && index < allAttachments.length) {
          const a = allAttachments[index];
          return [{ id: a.id, url: a.url, filename: a.filename, mimeType: a.mimeType, source: a.source, createdAt: a.createdAt.toISOString() }];
        }
        return [];
      }

      return allAttachments.map((a) => ({
        id: a.id,
        url: a.url,
        filename: a.filename,
        mimeType: a.mimeType,
        source: a.source,
        createdAt: a.createdAt.toISOString(),
      }));
    } catch (error: any) {
      throw ApiException.internal(`Failed to get attachments: ${error.message}`, { operation: 'get_attachments', workflowRunId });
    }
  }

  async getAttachmentsByIds(ids: string[]) {
    try {
      return await this.prisma.attachment.findMany({
        where: { id: { in: ids } },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to get attachments by IDs: ${error.message}`, { operation: 'get_attachments_by_ids' });
    }
  }

  async storeAuthToken(id: string, authToken: string): Promise<void> {
    try {
      await this.prisma.workflowRun.update({
        where: { id },
        data: { authToken },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to store auth token: ${error.message}`, { operation: 'store_auth_token', id });
    }
  }

  async getAuthToken(id: string): Promise<string | null> {
    try {
      const run = await this.prisma.workflowRun.findUnique({
        where: { id },
        select: { authToken: true },
      });
      return run?.authToken ?? null;
    } catch (error: any) {
      throw ApiException.internal(`Failed to get auth token: ${error.message}`, { operation: 'get_auth_token', id });
    }
  }

  async updateTitle(id: string, title: string) {
    try {
      return await this.prisma.workflowRun.update({
        where: { id },
        data: { title },
      });
    } catch (error: any) {
      throw ApiException.internal(`Failed to update workflow run title: ${error.message}`, { operation: 'update_workflow_run_title', id });
    }
  }

  async getPendingInteraction(
    runId: string,
  ): Promise<{ type: string; data: Record<string, unknown> } | null> {
    try {
      const recentMessages = await this.prisma.message.findMany({
        where: { workflowRunId: runId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, data: true },
      });

      if (!recentMessages.length) return null;

      const interactive = recentMessages.find(
        (m) =>
          m.data &&
          typeof m.data === 'object' &&
          (m.data as Record<string, unknown>).callback_id,
      );

      if (!interactive) return null;

      if (recentMessages[0].id !== interactive.id) return null;

      return {
        type: interactive.type,
        data: interactive.data as Record<string, unknown>,
      };
    } catch (error: any) {
      throw ApiException.internal(`Failed to get pending interaction: ${error.message}`, { operation: 'get_pending_interaction', runId });
    }
  }

  async delete(id: string) {
    try {
      const workflowRun = await this.prisma.workflowRun.findUnique({
        where: { id },
      });

      if (!workflowRun) {
        throw ApiException.notFound(`Workflow run ${id} not found`, { operation: 'delete_workflow_run', id });
      }

      await this.prisma.workflowRun.delete({
        where: { id },
      });

      return { deleted: true };
    } catch (error: any) {
      if (error instanceof ApiException) throw error;
      throw ApiException.internal(`Failed to delete workflow run: ${error.message}`, { operation: 'delete_workflow_run', id });
    }
  }
}
