import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'chat-uploads');

@Injectable()
export class ChatUploadsService {
  private readonly logger = new Logger(ChatUploadsService.name);

  constructor() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async store(buffer: Buffer, originalname: string): Promise<{ id: string; filename: string }> {
    const id = randomUUID();
    const sanitized = path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(sanitized) || '.bin';
    const filename = `${id}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) {
      throw new Error('Invalid file path detected');
    }
    await fs.promises.writeFile(filePath, buffer);
    this.logger.debug(`Stored chat upload: ${filename}`);
    return { id, filename };
  }

  async storeFromBase64(b64Data: string, originalname: string): Promise<{ id: string; filename: string }> {
    const buffer = Buffer.from(b64Data, 'base64');
    return this.store(buffer, originalname);
  }

  async storeFromUrl(url: string, filename: string): Promise<{ id: string; filename: string }> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('Invalid URL provided');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local')) {
      throw new Error('Internal URLs are not allowed');
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from URL: ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return this.store(buffer, filename);
  }

  getFilePath(id: string): string | null {
    const files = fs.readdirSync(UPLOADS_DIR);
    const match = files.find((f) => f.startsWith(id));
    if (!match) return null;
    return path.join(UPLOADS_DIR, match);
  }

  buildUrl(id: string): string {
    return `/api/chat-uploads/${id}`;
  }
}
