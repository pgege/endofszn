import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MedusaModule, EventsModule],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
