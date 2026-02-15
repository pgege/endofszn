import { Module } from '@nestjs/common';
import { LlmContextService } from './llm-context.service';

@Module({
  providers: [LlmContextService],
  exports: [LlmContextService],
})
export class LlmContextModule {}
