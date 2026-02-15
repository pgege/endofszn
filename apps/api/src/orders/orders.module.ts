import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MedusaModule, EventsModule],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
