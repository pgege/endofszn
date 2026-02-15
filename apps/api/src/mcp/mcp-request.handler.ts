import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PubSubService } from '../pubsub';
import { WorkflowRunsService } from '../workflow-runs';
import { VendorService } from '../vendor/vendor.service';
import { CatalogService } from '../catalog';
import { OrdersService } from '../orders';
import { InventoryService } from '../inventory';
import { CustomersService } from '../customers';
import { PromotionsService } from '../promotions';
import { CollectionsService } from '../collections';
import { ShippingService } from '../shipping';
import { PricingService } from '../pricing';

interface McpRequest {
  request_id: string;
  tool_name: string;
  params: Record<string, any>;
  workflow_run_id: string;
}

const REQUEST_CHANNEL = 'mcp:store-management:request';
const RESPONSE_PREFIX = 'mcp:store-management:response:';

@Injectable()
export class McpRequestHandler implements OnModuleInit {
  private readonly logger = new Logger(McpRequestHandler.name);

  constructor(
    private readonly pubsub: PubSubService,
    private readonly workflowRuns: WorkflowRunsService,
    private readonly vendorService: VendorService,
    private readonly catalog: CatalogService,
    private readonly ordersService: OrdersService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
    private readonly promotionsService: PromotionsService,
    private readonly collectionsService: CollectionsService,
    private readonly shippingService: ShippingService,
    private readonly pricingService: PricingService,
  ) {}

  async onModuleInit() {
    await this.pubsub.subscribe(REQUEST_CHANNEL, (_channel, message) => {
      const req = message as unknown as McpRequest;
      this.handleRequest(req).catch((err) =>
        this.logger.error(`Unhandled error processing MCP request: ${err}`),
      );
    });
    this.logger.log(`Subscribed to ${REQUEST_CHANNEL}`);
  }

  private async handleRequest(req: McpRequest) {
    const { request_id, tool_name, params, workflow_run_id } = req;

    try {
      const token = await this.workflowRuns.getAuthToken(workflow_run_id);
      if (!token) {
        await this.publishResponse(request_id, null, 'No auth token found for workflow run');
        return;
      }

      const run = await this.workflowRuns.findOne(workflow_run_id);
      const vendorId = run.vendorId;

      const result = await this.executeTool(tool_name, params, token, vendorId);
      await this.publishResponse(request_id, result, null);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const details = err?.details || err?.response?.details || undefined;
      this.logger.error(`MCP tool ${tool_name} failed: ${message}`);
      await this.publishResponse(request_id, null, message, details);
    }
  }

  private async publishResponse(requestId: string, result: any, error: string | null, details?: Record<string, unknown>) {
    const channel = `${RESPONSE_PREFIX}${requestId}`;
    const payload = error ? { error, details } : { result };
    await this.pubsub.publish(channel, payload);
  }

  private listParams(params: Record<string, any>) {
    return {
      id: params.id,
      limit: params.limit,
      offset: params.offset,
      q: params.q,
      order: params.order,
    };
  }

  private async executeTool(toolName: string, params: Record<string, any>, token: string, vendorId: string): Promise<any> {
    switch (toolName) {
      // ─── Stores ──────────────────────────────────────────────────────

      case 'list_stores':
        return this.vendorService.getStores(token, this.listParams(params));

      case 'create_stores':
        return this.vendorService.createStores(token, vendorId, params.stores || [], 'agent');

      case 'update_stores': {
        const updates = (params.updates || []).map((u: any) => {
          const { store_id, ...fields } = u;
          return { id: store_id, ...fields };
        });
        return this.vendorService.updateStores(token, vendorId, updates, 'agent');
      }

      case 'delete_stores':
        return this.vendorService.deleteStores(token, vendorId, params.store_ids || [], 'agent');

      // ─── Products ────────────────────────────────────────────────────

      case 'list_products':
        return this.catalog.getProducts(token, params.store_id, {
          ...this.listParams(params),
          status: params.status ? (Array.isArray(params.status) ? params.status : [params.status]) : undefined,
          category_id: params.category_id ? (Array.isArray(params.category_id) ? params.category_id : [params.category_id]) : undefined,
          fields: params.fields === 'full' ? '*categories,*variants,*images,*options' : undefined,
        });

      case 'create_products':
        return this.catalog.createProducts(token, vendorId, params.store_id, params.products || [], 'agent');

      case 'update_products':
        return this.catalog.updateProducts(token, vendorId, params.store_id, params.updates || [], 'agent');

      case 'delete_products':
        return this.catalog.deleteProducts(token, vendorId, params.store_id, params.product_ids || [], 'agent');

      // ─── Variants ────────────────────────────────────────────────────

      case 'list_variants': {
        const result = await this.catalog.getProducts(token, params.store_id, { id: [params.product_id] });
        const product = result.products?.[0];
        let variants: any[] = product?.variants || [];
        if (params.id) variants = variants.filter((v: any) => params.id.includes(v.id));
        if (params.q) {
          const q = params.q.toLowerCase();
          variants = variants.filter((v: any) => v.title?.toLowerCase().includes(q) || v.sku?.toLowerCase().includes(q));
        }
        if (params.order) {
          const desc = params.order.startsWith('-');
          const field = desc ? params.order.slice(1) : params.order;
          variants.sort((a: any, b: any) => {
            const aVal = a[field] ?? '';
            const bVal = b[field] ?? '';
            if (aVal < bVal) return desc ? 1 : -1;
            if (aVal > bVal) return desc ? -1 : 1;
            return 0;
          });
        }
        const total = variants.length;
        const offset = params.offset || 0;
        const limit = params.limit || variants.length;
        variants = variants.slice(offset, offset + limit);
        return { variants, count: total, limit, offset };
      }

      case 'create_variants':
        return this.catalog.createVariants(token, vendorId, params.store_id, params.product_id, params.variants || [], 'agent');

      case 'update_variants': {
        const updates = (params.updates || []).map((u: any) => {
          const { variant_id, ...fields } = u;
          return { id: variant_id, ...fields };
        });
        return this.catalog.updateVariants(token, vendorId, params.store_id, params.product_id, updates, 'agent');
      }

      case 'delete_variants':
        return this.catalog.deleteVariants(token, vendorId, params.store_id, params.product_id, params.variant_ids || [], 'agent');

      // ─── Categories ──────────────────────────────────────────────────

      case 'list_categories':
        return this.catalog.getCategories(token, params.store_id, this.listParams(params));

      case 'create_categories':
        return this.catalog.createCategories(token, vendorId, params.store_id, params.categories || [], 'agent');

      case 'update_categories':
        return this.catalog.updateCategories(token, vendorId, params.store_id, params.updates || [], 'agent');

      case 'delete_categories':
        return this.catalog.deleteCategories(token, vendorId, params.store_id, params.category_ids || [], 'agent');

      // ─── Category utilities ──────────────────────────────────────────

      case 'list_category_templates':
        return this.catalog.getCategoryTemplates(token, params.store_id, this.listParams(params));

      case 'apply_category_template':
        return this.catalog.applyCategoryTemplate(token, vendorId, params.store_id, { template_id: params.template_id }, 'agent');

      case 'list_uncategorized_products':
        return this.catalog.getUncategorizedProducts(token, params.store_id, this.listParams(params));

      case 'bulk_categorize_products':
        return this.catalog.bulkCategorize(token, vendorId, params.store_id, { assignments: params.assignments }, 'agent');

      // ─── Product options ─────────────────────────────────────────────

      case 'update_product_options': {
        const updates = (params.updates || []).map((u: any) => {
          const { option_id, ...fields } = u;
          return { id: option_id, ...fields };
        });
        return this.catalog.updateProductOptions(token, vendorId, params.store_id, params.product_id, updates, 'agent');
      }

      // ─── Media ───────────────────────────────────────────────────────

      case 'upload_product_images':
        return this.catalog.uploadProductImages(token, vendorId, params.store_id, params.product_id, params.images || [], 'agent');

      case 'delete_product_images':
        return this.catalog.deleteProductImages(token, vendorId, params.store_id, params.product_id, params.image_ids || [], 'agent');

      case 'update_variant_images':
        return this.catalog.bulkUpdateVariantImages(token, vendorId, params.store_id, params.product_id, params.assign || [], params.unassign || [], 'agent');

      case 'update_product_media':
        return this.catalog.updateProducts(token, vendorId, params.store_id, [{
          id: params.product_id,
          thumbnail: params.thumbnail,
          images: params.images,
        }], 'agent');

      // ─── Orders ──────────────────────────────────────────────────────

      case 'list_orders':
        return this.ordersService.getOrders(token, params.store_id, {
          ...this.listParams(params),
          status: params.status ? (Array.isArray(params.status) ? params.status : [params.status]) : undefined,
        });

      case 'create_fulfillment':
        return this.ordersService.createFulfillment(token, vendorId, params.store_id, params.order_id, params, 'agent');

      case 'cancel_order':
        return this.ordersService.cancelOrder(token, vendorId, params.store_id, params.order_id, 'agent');

      // ─── Inventory ───────────────────────────────────────────────────

      case 'list_inventory':
        return this.inventoryService.getInventory(token, params.store_id, this.listParams(params));

      case 'update_inventory':
        return this.inventoryService.updateInventoryItems(token, vendorId, params.store_id, params.updates || [], 'agent');

      // ─── Stock Locations ────────────────────────────────────────────

      case 'list_stock_locations':
        return this.inventoryService.getStockLocations(token, params.store_id, this.listParams(params));

      case 'create_stock_locations':
        return this.inventoryService.createStockLocations(token, vendorId, params.store_id, { stock_locations: params.stock_locations || [], set_as_default: params.set_as_default }, 'agent');

      case 'update_stock_locations':
        return this.inventoryService.updateStockLocations(token, vendorId, params.store_id, { stock_locations: params.stock_locations || [] }, 'agent');

      case 'delete_stock_locations':
        return this.inventoryService.deleteStockLocations(token, vendorId, params.store_id, params.ids || [], 'agent');

      // ─── Customers ───────────────────────────────────────────────────

      case 'list_customers':
        return this.customersService.getCustomers(token, params.store_id, this.listParams(params));

      // ─── Promotions ──────────────────────────────────────────────────

      case 'list_promotions':
        return this.promotionsService.getPromotions(token, params.store_id, this.listParams(params));

      case 'create_promotions':
        return this.promotionsService.createPromotions(token, vendorId, params.store_id, params.promotions || [], 'agent');

      case 'update_promotions':
        return this.promotionsService.updatePromotions(token, vendorId, params.store_id, params.updates || [], 'agent');

      case 'delete_promotions':
        return this.promotionsService.deletePromotions(token, vendorId, params.store_id, params.promotion_ids || [], 'agent');

      // ─── Collections ─────────────────────────────────────────────────

      case 'list_collections':
        return this.collectionsService.getCollections(token, params.store_id, this.listParams(params));

      case 'create_collections':
        return this.collectionsService.createCollections(token, vendorId, params.store_id, params.collections || [], 'agent');

      case 'update_collections':
        return this.collectionsService.updateCollections(token, vendorId, params.store_id, params.updates || [], 'agent');

      case 'delete_collections':
        return this.collectionsService.deleteCollections(token, vendorId, params.store_id, params.collection_ids || [], 'agent');

      case 'update_collection_products':
        return this.collectionsService.updateCollectionProducts(token, vendorId, params.store_id, params.collection_id, { add: params.add, remove: params.remove }, 'agent');

      // ─── Shipping ────────────────────────────────────────────────────

      case 'list_shipping_options':
        return this.shippingService.getShippingOptions(token, params.store_id, this.listParams(params));

      case 'create_shipping_options':
        return this.shippingService.createShippingOptions(token, vendorId, params.store_id, params.shipping_options || [], 'agent');

      case 'update_shipping_options':
        return this.shippingService.updateShippingOptions(token, vendorId, params.store_id, params.updates || [], 'agent');

      case 'delete_shipping_options':
        return this.shippingService.deleteShippingOptions(token, vendorId, params.store_id, params.shipping_option_ids || [], 'agent');

      // ─── Price Lists ─────────────────────────────────────────────────

      case 'list_price_lists':
        return this.pricingService.getPriceLists(token, params.store_id, this.listParams(params));

      case 'create_price_lists':
        return this.pricingService.createPriceLists(token, vendorId, params.store_id, params.price_lists || [], 'agent');

      case 'update_price_lists':
        return this.pricingService.updatePriceLists(token, vendorId, params.store_id, params.updates || [], 'agent');

      case 'delete_price_lists':
        return this.pricingService.deletePriceLists(token, vendorId, params.store_id, params.price_list_ids || [], 'agent');

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
