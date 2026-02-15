import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { MedusaModule } from '../medusa/medusa.module';

@Module({
  imports: [MedusaModule],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
