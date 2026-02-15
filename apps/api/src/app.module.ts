import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MedusaModule } from './medusa/medusa.module';
import { VendorModule } from './vendor/vendor.module';
import { EventsModule } from './events/events.module';
import { PubSubModule } from './pubsub';
import { PrismaModule } from './prisma';
import { WorkflowRunsModule } from './workflow-runs';
import { WorkflowsModule } from './workflows';
import { McpModule } from './mcp/mcp.module';
import { ChatUploadsModule } from './chat-uploads';
import { CatalogModule } from './catalog';
import { OrdersModule } from './orders';
import { InventoryModule } from './inventory';
import { CustomersModule } from './customers';
import { PromotionsModule } from './promotions';
import { CollectionsModule } from './collections';
import { ShippingModule } from './shipping';
import { PricingModule } from './pricing';
import { AnalyticsModule } from './analytics';

@Module({
  imports: [
    PrismaModule,
    PubSubModule,
    MedusaModule,
    VendorModule,
    EventsModule,
    WorkflowRunsModule,
    WorkflowsModule,
    McpModule,
    ChatUploadsModule,
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
  controllers: [AppController],
})
export class AppModule {}
