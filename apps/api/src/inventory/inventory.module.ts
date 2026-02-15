import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MedusaModule, EventsModule],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
