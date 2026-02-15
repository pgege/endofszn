import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MedusaModule, EventsModule],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
