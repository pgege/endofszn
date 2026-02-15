export type MessageHandler = (channel: string, message: unknown) => void;

export abstract class PubSubService {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract publish(channel: string, message: object): Promise<void>;
  abstract subscribe(pattern: string, handler: MessageHandler): Promise<void>;
  abstract unsubscribe(pattern: string): Promise<void>;
  abstract appendBuffer(key: string, content: string): Promise<void>;
  abstract getBuffer(key: string): Promise<string>;
  abstract deleteBuffers(...keys: string[]): Promise<void>;
  abstract setKey(key: string, value: string, ttlSeconds?: number): Promise<void>;
  abstract getKey(key: string): Promise<string | null>;
  abstract deleteKey(key: string): Promise<void>;
}
