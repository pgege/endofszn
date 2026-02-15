import { Controller, Get, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PubSubService } from '../pubsub';
import { AuthToken, ApiException } from '../common';

const REQUEST_CHANNEL = 'mcp:servers:list:request';
const RESPONSE_PREFIX = 'mcp:servers:list:response:';
const TIMEOUT_MS = 5_000;

@Controller('api/mcp')
export class McpServersController {
  private readonly logger = new Logger(McpServersController.name);

  constructor(private readonly pubsub: PubSubService) {}

  private requireAuth(token: string | undefined): string {
    if (!token) throw ApiException.unauthorized('Not authenticated');
    return token;
  }

  @Get('servers')
  async listServers(@AuthToken() token: string | undefined): Promise<{ servers: string[] }> {
    this.requireAuth(token);
    const requestId = randomUUID();
    const responseChannel = `${RESPONSE_PREFIX}${requestId}`;

    return new Promise<{ servers: string[] }>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pubsub.unsubscribe(responseChannel);
        reject(new Error('Timeout waiting for MCP server list'));
      }, TIMEOUT_MS);

      this.pubsub.subscribe(responseChannel, (_channel, message) => {
        clearTimeout(timer);
        this.pubsub.unsubscribe(responseChannel);
        const data = message as { servers?: string[] };
        resolve({ servers: data.servers || [] });
      }).then(() => {
        this.pubsub.publish(REQUEST_CHANNEL, { request_id: requestId });
      }).catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
