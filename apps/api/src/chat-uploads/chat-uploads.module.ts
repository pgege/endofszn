import { Module } from '@nestjs/common';
import { ChatUploadsController } from './chat-uploads.controller';
import { ChatUploadsService } from './chat-uploads.service';

@Module({
  controllers: [ChatUploadsController],
  providers: [ChatUploadsService],
  exports: [ChatUploadsService],
})
export class ChatUploadsModule {}
