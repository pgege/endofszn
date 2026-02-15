import { Module } from '@nestjs/common';
import { MedusaModule } from '../medusa/medusa.module';
import { EventsModule } from '../events/events.module';
import { CatalogModule } from '../catalog';
import { OrdersModule } from '../orders';
import { InventoryModule } from '../inventory';
import { CustomersModule } from '../customers';
import { PromotionsModule } from '../promotions';
import { CollectionsModule } from '../collections';
import { ShippingModule } from '../shipping';
import { PricingModule } from '../pricing';
import { AnalyticsModule } from '../analytics';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  imports: [
    MedusaModule,
    EventsModule,
    CatalogModule,
    OrdersModule,
    InventoryModule,
    CustomersModule,
    PromotionsModule,
    CollectionsModule,
    ShippingModule,
    PricingModule,
    AnalyticsModule,
  ],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
