import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ChatUploadsService } from './chat-uploads.service';
import { AuthToken, ApiException } from '../common';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.json': 'application/json',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

@Controller('api/chat-uploads')
export class ChatUploadsController {
  constructor(private readonly chatUploads: ChatUploadsService) {}

  private requireAuth(token: string | undefined): string {
    if (!token) throw ApiException.unauthorized('Not authenticated');
    return token;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @AuthToken() token: string | undefined,
  ) {
    this.requireAuth(token);
    if (!file) {
      throw ApiException.badRequest('No file provided', { operation: 'upload' });
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw ApiException.badRequest(
        `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP, PDF`,
        { operation: 'upload', mimetype: file.mimetype },
      );
    }
    const { id, filename } = await this.chatUploads.store(
      file.buffer,
      file.originalname,
    );
    const url = this.chatUploads.buildUrl(id);
    return { id, url, filename: file.originalname, mimeType: file.mimetype };
  }

  @Get(':id')
  async serve(
    @Param('id') id: string,
    @AuthToken() token: string | undefined,
    @Res() res: Response,
  ) {
    this.requireAuth(token);
    if (!/^[0-9a-f-]{36}$/.test(id)) {
      throw ApiException.badRequest('Invalid file ID', { operation: 'serve', id });
    }
    const filePath = this.chatUploads.getFilePath(id);
    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
