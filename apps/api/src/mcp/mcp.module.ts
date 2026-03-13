import { Module } from '@nestjs/common';
import { McpRequestHandler } from './mcp-request.handler';
import { McpServersController } from './mcp-servers.controller';
import { VendorModule } from '../vendor/vendor.module';
import { CatalogModule } from '../catalog';
import { OrdersModule } from '../orders';
import { InventoryModule } from '../inventory';
import { CustomersModule } from '../customers';
import { PromotionsModule } from '../promotions';
import { CollectionsModule } from '../collections';
import { ShippingModule } from '../shipping';
import { PricingModule } from '../pricing';
import { WorkflowRunsModule } from '../workflow-runs';
import { StoreConfigModule } from '../store-config';

@Module({
  imports: [
    VendorModule,
    CatalogModule,
    OrdersModule,
    InventoryModule,
    CustomersModule,
    PromotionsModule,
    CollectionsModule,
    ShippingModule,
    PricingModule,
    WorkflowRunsModule,
    StoreConfigModule,
  ],
  controllers: [McpServersController],
  providers: [McpRequestHandler],
})
export class McpModule {}
