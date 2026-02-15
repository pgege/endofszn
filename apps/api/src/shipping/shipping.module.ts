import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MedusaModule, EventsModule],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
