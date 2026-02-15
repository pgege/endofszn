import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';
import { WorkflowRunsModule } from '../workflow-runs';
import { ChatUploadsModule } from '../chat-uploads';

@Module({
  imports: [MedusaModule, EventsModule, WorkflowRunsModule, ChatUploadsModule],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
