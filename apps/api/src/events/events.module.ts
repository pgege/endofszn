import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { StoreSyncService } from './store-sync.service';
import { WorkflowRunsModule } from '../workflow-runs';
import { WorkflowsModule } from '../workflows';
import { LlmContextModule } from '../llm-context';
import { ChatUploadsModule } from '../chat-uploads';
import { MedusaModule } from '../medusa/medusa.module';

@Module({
  imports: [WorkflowRunsModule, WorkflowsModule, LlmContextModule, ChatUploadsModule, MedusaModule],
  providers: [EventsGateway, StoreSyncService],
  exports: [EventsGateway, StoreSyncService],
})
export class EventsModule {}
