import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PubSubService, MessageHandler } from './pubsub.service';

@Injectable()
export class RedisPubSubService
  extends PubSubService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisPubSubService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, MessageHandler> = new Map();

  constructor() {
    super();
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.publisher = new Redis({ host: redisHost, port: redisPort });
    this.subscriber = new Redis({ host: redisHost, port: redisPort });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      const handler = this.handlers.get(pattern);
      if (handler) {
        try {
          const msgSize = Buffer.byteLength(message, 'utf8');
          const parsed = JSON.parse(message);
          const msgType = parsed?.type || 'unknown';
          if (msgType !== 'thinking' && msgType !== 'text_delta') {
            this.logger.log(
              `Received ${msgType} on ${channel} (${(msgSize / 1024).toFixed(1)}KB)`,
            );
          }
          Promise.resolve(handler(channel, parsed)).catch((e) => {
            this.logger.error(
              `Async handler error on ${channel} (type=${msgType}): ${e?.message || e}`,
            );
          });
        } catch (e) {
          const preview = message?.substring(0, 200) || '';
          const msgSize = Buffer.byteLength(message || '', 'utf8');
          this.logger.warn(
            `Failed to parse message on ${channel} (${(msgSize / 1024).toFixed(1)}KB): ${e?.message || e} | preview: ${preview}`,
          );
        }
      }
    });

    this.subscriber.on('error', (err) => {
      this.logger.error(`Redis subscriber error: ${err.message}`, err.stack);
    });

    this.subscriber.on('close', () => {
      this.logger.warn('Redis subscriber connection closed');
    });

    this.subscriber.on('reconnecting', () => {
      this.logger.warn('Redis subscriber reconnecting...');
    });

    this.subscriber.on('connect', () => {
      this.logger.log('Redis subscriber connected');
    });

    this.publisher.on('error', (err) => {
      this.logger.error(`Redis publisher error: ${err.message}`, err.stack);
    });

    this.publisher.on('close', () => {
      this.logger.warn('Redis publisher connection closed');
    });

    this.publisher.on('reconnecting', () => {
      this.logger.warn('Redis publisher reconnecting...');
    });

    this.logger.log('Connected to Redis');
  }

  async disconnect(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
    this.logger.log('Disconnected from Redis');
  }

  async publish(channel: string, message: object): Promise<void> {
    const payload = JSON.stringify(message);
    await this.publisher.publish(channel, payload);
    this.logger.debug(`Published to ${channel}`);
  }

  async subscribe(pattern: string, handler: MessageHandler): Promise<void> {
    this.handlers.set(pattern, handler);
    await this.subscriber.psubscribe(pattern);
    this.logger.log(`Subscribed to pattern: ${pattern}`);
  }

  async unsubscribe(pattern: string): Promise<void> {
    await this.subscriber.punsubscribe(pattern);
    this.handlers.delete(pattern);
    this.logger.log(`Unsubscribed from pattern: ${pattern}`);
  }

  async appendBuffer(key: string, content: string): Promise<void> {
    await this.publisher.append(key, content);
    await this.publisher.expire(key, 3600);
  }

  async getBuffer(key: string): Promise<string> {
    return (await this.publisher.get(key)) || '';
  }

  async deleteBuffers(...keys: string[]): Promise<void> {
    if (keys.length) await this.publisher.del(...keys);
  }

  async setKey(key: string, value: string, ttlSeconds = 300): Promise<void> {
    await this.publisher.set(key, value, 'EX', ttlSeconds);
  }

  async getKey(key: string): Promise<string | null> {
    return this.publisher.get(key);
  }

  async deleteKey(key: string): Promise<void> {
    await this.publisher.del(key);
  }
}
