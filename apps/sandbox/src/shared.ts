import Redis from 'ioredis';
import { randomUUID } from 'crypto';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REQUEST_CHANNEL = 'mcp:store-management:request';
const RESPONSE_PREFIX = 'mcp:store-management:response:';
const TIMEOUT_MS = 30_000;

const publisher = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
const subscriber = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

const pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();

subscriber.on('message', (channel: string, message: string) => {
  const requestId = channel.slice(RESPONSE_PREFIX.length);
  const entry = pending.get(requestId);
  if (!entry) return;
  pending.delete(requestId);
  try {
    const parsed = JSON.parse(message);
    if (parsed.error) {
      entry.reject(new Error(parsed.error));
    } else {
      entry.resolve(parsed.result);
    }
  } catch {
    entry.reject(new Error('Invalid response'));
  }
});

export async function callApi(toolName: string, params: Record<string, unknown>): Promise<any> {
  const requestId = randomUUID();
  const responseChannel = `${RESPONSE_PREFIX}${requestId}`;

  await subscriber.subscribe(responseChannel);

  const payload = JSON.stringify({
    request_id: requestId,
    tool_name: toolName,
    params,
    workflow_run_id: '',
  });

  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      subscriber.unsubscribe(responseChannel);
      reject(new Error(`API call ${toolName} timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    pending.set(requestId, {
      resolve: (v) => { clearTimeout(timer); subscriber.unsubscribe(responseChannel); resolve(v); },
      reject: (e) => { clearTimeout(timer); subscriber.unsubscribe(responseChannel); reject(e); },
    });

    publisher.publish(REQUEST_CHANNEL, payload).catch(reject);
  });
}

export async function cleanup() {
  await publisher.quit();
  await subscriber.quit();
}
