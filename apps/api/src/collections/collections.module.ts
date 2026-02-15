import { Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MedusaModule, EventsModule],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
