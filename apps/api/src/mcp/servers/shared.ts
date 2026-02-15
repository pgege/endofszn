import Redis from 'ioredis';
import { randomUUID } from 'crypto';

export const WORKFLOW_RUN_ID = process.env.WORKFLOW_RUN_ID;
if (!WORKFLOW_RUN_ID) {
  console.error('WORKFLOW_RUN_ID environment variable is required');
  process.exit(1);
}
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REQUEST_CHANNEL = 'mcp:store-management:request';
export const RESPONSE_PREFIX = 'mcp:store-management:response:';
export const TIMEOUT_MS = 30_000;

export const publisher = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
export const subscriber = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

const pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();

subscriber.on('message', (channel: string, message: string) => {
  const requestId = channel.slice(RESPONSE_PREFIX.length);
  const entry = pending.get(requestId);
  if (!entry) return;
  pending.delete(requestId);
  try {
    const parsed = JSON.parse(message);
    if (parsed.error) {
      entry.resolve({ content: [{ type: 'text', text: JSON.stringify({ error: parsed.error }) }], isError: true });
    } else {
      entry.resolve({ content: [{ type: 'text', text: JSON.stringify(parsed.result, null, 2) }] });
    }
  } catch {
    entry.reject(new Error('Invalid response'));
  }
});

export async function callApi(toolName: string, params: Record<string, unknown>) {
  const requestId = randomUUID();
  const responseChannel = `${RESPONSE_PREFIX}${requestId}`;

  await subscriber.subscribe(responseChannel);

  const payload = JSON.stringify({
    request_id: requestId,
    tool_name: toolName,
    params,
    workflow_run_id: WORKFLOW_RUN_ID,
  });

  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      subscriber.unsubscribe(responseChannel);
      reject(new Error(`MCP tool ${toolName} timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    pending.set(requestId, {
      resolve: (v) => { clearTimeout(timer); subscriber.unsubscribe(responseChannel); resolve(v); },
      reject: (e) => { clearTimeout(timer); subscriber.unsubscribe(responseChannel); reject(e); },
    });

    publisher.publish(REQUEST_CHANNEL, payload).catch(reject);
  });
}
