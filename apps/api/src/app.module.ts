import { Module } from '@nestjs/common';
import { MedusaModule } from './medusa/medusa.module';
import { CustomerModule } from './customer/customer.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [MedusaModule, CustomerModule, EventsModule],
})
export class AppModule {}
