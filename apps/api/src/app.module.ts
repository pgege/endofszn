import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MedusaModule } from './medusa/medusa.module';
import { VendorModule } from './vendor/vendor.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [MedusaModule, VendorModule, EventsModule],
  controllers: [AppController],
})
export class AppModule {}
