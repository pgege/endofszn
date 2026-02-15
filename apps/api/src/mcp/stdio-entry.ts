import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

const WORKFLOW_RUN_ID = process.env.WORKFLOW_RUN_ID;
if (!WORKFLOW_RUN_ID) {
  console.error('WORKFLOW_RUN_ID environment variable is required');
  process.exit(1);
}
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REQUEST_CHANNEL = 'mcp:store-management:request';
const RESPONSE_PREFIX = 'mcp:store-management:response:';
const TIMEOUT_MS = 30_000;

const publisher = new Redis({ host: REDIS_HOST, port: REDIS_PORT });
const subscriber = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

const pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>();

subscriber.on('message', (channel: string, message: string) => {
  const requestId = channel.slice(RESPONSE_PREFIX.length);
  const entry = pending.get(requestId);
  if (!entry) return;
  pending.delete(requestId);
  try {
    const parsed = JSON.parse(message);
    if (parsed.error) {
      entry.resolve({ content: [{ type: 'text', text: JSON.stringify({ error: parsed.error }) }], isError: true });
    } else {
      entry.resolve({ content: [{ type: 'text', text: JSON.stringify(parsed.result, null, 2) }] });
    }
  } catch {
    entry.reject(new Error('Invalid response'));
  }
});

async function callApi(toolName: string, params: Record<string, unknown>) {
  const requestId = randomUUID();
  const responseChannel = `${RESPONSE_PREFIX}${requestId}`;

  await subscriber.subscribe(responseChannel);

  const payload = JSON.stringify({
    request_id: requestId,
    tool_name: toolName,
    params,
    workflow_run_id: WORKFLOW_RUN_ID,
  });

  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      subscriber.unsubscribe(responseChannel);
      reject(new Error(`MCP tool ${toolName} timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    pending.set(requestId, {
      resolve: (v) => { clearTimeout(timer); subscriber.unsubscribe(responseChannel); resolve(v); },
      reject: (e) => { clearTimeout(timer); subscriber.unsubscribe(responseChannel); reject(e); },
    });

    publisher.publish(REQUEST_CHANNEL, payload).catch(reject);
  });
}

const listParams = {
  id: z.array(z.string()).optional().describe('Filter by one or more IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
};

const server = new McpServer({ name: 'store-management', version: '1.0.0' });

// ─── Stores ──────────────────────────────────────────────────────────────────

server.tool('list_stores', 'Lists all stores for the vendor. Use id filter to get specific store details.', { ...listParams, id: z.array(z.string()).optional().describe('Filter by one or more store IDs') }, async (params) => callApi('list_stores', params ?? {}));

server.tool('create_stores', 'Creates one or more stores', {
  stores: z.array(z.object({
    name: z.string().describe('The name of the store'),
    description: z.string().optional().describe('Store description'),
    default_currency_code: z.string().optional().describe('ISO currency code'),
  })).describe('Array of stores to create'),
}, async (params) => callApi('create_stores', params));

server.tool('update_stores', 'Updates one or more stores', {
  updates: z.array(z.object({
    store_id: z.string().describe('The ID of the store to update'),
    name: z.string().optional().describe('Store name'),
    description: z.string().optional().describe('Store description'),
    is_published: z.boolean().optional().describe('Whether store is live'),
    accepts_orders: z.boolean().optional().describe('Whether store accepts orders'),
  })).describe('Array of store updates'),
}, async (params) => callApi('update_stores', params));

server.tool('delete_stores', 'Deletes one or more stores', {
  store_ids: z.array(z.string()).describe('Array of store IDs to delete'),
}, async (params) => callApi('delete_stores', params));

// ─── Products ────────────────────────────────────────────────────────────────

server.tool('list_products', 'Lists products for a store with search, filter, sort, and pagination. Use id filter to get specific product details.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more product IDs'),
  fields: z.enum(['basics', 'full']).optional().default('basics').describe("'basics' returns core fields, 'full' includes all relations"),
  status: z.array(z.enum(['draft', 'published'])).optional().describe('Filter by one or more statuses'),
  category_id: z.array(z.string()).optional().describe('Filter by one or more category IDs'),
}, async (params) => callApi('list_products', params));

server.tool('create_products', 'Creates one or more products', {
  store_id: z.string().describe('The ID of the store'),
  products: z.array(z.object({
    title: z.string().describe('Product title'),
    description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    options: z.array(z.object({
      title: z.string(),
      values: z.array(z.string()),
    })).optional(),
    variants: z.array(z.object({
      title: z.string(),
      options: z.record(z.string(), z.string()).optional(),
      prices: z.array(z.object({
        amount: z.number().describe('Price in cents'),
        currency_code: z.string(),
      })).optional(),
      sku: z.string().optional(),
      manage_inventory: z.boolean().optional(),
    })).optional(),
    category_ids: z.array(z.string()).optional(),
  })).describe('Array of products to create'),
}, async (params) => callApi('create_products', params));

server.tool('update_products', 'Updates one or more products', {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    product_id: z.string().describe('The ID of the product to update'),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    category_ids: z.array(z.string()).optional(),
  })).describe('Array of product updates'),
}, async (params) => callApi('update_products', params));

server.tool('delete_products', 'Deletes one or more products', {
  store_id: z.string().describe('The ID of the store'),
  product_ids: z.array(z.string()).describe('Array of product IDs to delete'),
}, async (params) => callApi('delete_products', params));

// ─── Variants ────────────────────────────────────────────────────────────────

server.tool('list_variants', 'Lists variants for a product. Pass id to filter by specific variant IDs.', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  id: z.array(z.string()).optional().describe('Filter by one or more variant IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_variants', params));

server.tool('create_variants', 'Creates variants for a product', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  variants: z.array(z.object({
    title: z.string(),
    options: z.record(z.string(), z.string()).optional(),
    prices: z.array(z.object({
      amount: z.number().describe('Price in cents'),
      currency_code: z.string(),
    })).optional(),
    sku: z.string().optional(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
  })).describe('Array of variants'),
}, async (params) => callApi('create_variants', params));

server.tool('update_variants', 'Updates one or more variants', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  updates: z.array(z.object({
    variant_id: z.string().describe('The ID of the variant'),
    title: z.string().optional(),
    price: z.number().optional().describe('Price in cents'),
    sku: z.string().optional(),
    currency_code: z.string().optional(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
  })).describe('Array of variant updates'),
}, async (params) => callApi('update_variants', params));

server.tool('delete_variants', 'Deletes one or more variants', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  variant_ids: z.array(z.string()).describe('Array of variant IDs to delete'),
}, async (params) => callApi('delete_variants', params));

// ─── Categories ──────────────────────────────────────────────────────────────

server.tool('list_categories', 'Lists all categories for a store. Use id filter to get specific category details.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more category IDs'),
}, async (params) => callApi('list_categories', params));

server.tool('create_categories', 'Creates one or more categories', {
  store_id: z.string().describe('The ID of the store'),
  categories: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    parent_category_id: z.string().optional(),
    handle: z.string().optional(),
  })).describe('Array of categories to create'),
}, async (params) => callApi('create_categories', params));

server.tool('update_categories', 'Updates one or more categories', {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    category_id: z.string().describe('The ID of the category'),
    name: z.string().optional(),
    description: z.string().optional(),
    handle: z.string().optional(),
  })).describe('Array of category updates'),
}, async (params) => callApi('update_categories', params));

server.tool('delete_categories', 'Deletes one or more categories', {
  store_id: z.string().describe('The ID of the store'),
  category_ids: z.array(z.string()).describe('Array of category IDs to delete'),
}, async (params) => callApi('delete_categories', params));

// ─── Category utilities ──────────────────────────────────────────────────────

server.tool('list_category_templates', 'Lists available category templates. Pass id to filter by specific template IDs.', {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more template IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_category_templates', params));

server.tool('apply_category_template', 'Applies a category template to a store', {
  store_id: z.string().describe('The ID of the store'),
  template_id: z.string().describe('The ID of the template to apply'),
}, async (params) => callApi('apply_category_template', params));

server.tool('list_uncategorized_products', 'Lists products not assigned to any category. Pass id to filter by specific product IDs.', {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more product IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_uncategorized_products', params));

server.tool('bulk_categorize_products', 'Bulk assigns products to categories', {
  store_id: z.string().describe('The ID of the store'),
  assignments: z.array(z.object({
    product_id: z.string(),
    category_ids: z.array(z.string()),
  })).describe('Array of product-category assignments'),
}, async (params) => callApi('bulk_categorize_products', params));

// ─── Product options ─────────────────────────────────────────────────────────

server.tool('update_product_options', 'Updates one or more product options', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  updates: z.array(z.object({
    option_id: z.string().describe('The ID of the option'),
    title: z.string().optional().describe('New title for the option'),
    values: z.array(z.string()).optional().describe('New values for the option'),
  })).describe('Array of option updates'),
}, async (params) => callApi('update_product_options', params));

// ─── Media ───────────────────────────────────────────────────────────────────

server.tool('upload_product_images', 'Uploads chat attachments to permanent storage and adds them to a product', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  images: z.array(z.object({
    attachment_id: z.string().describe('Attachment ID from the chat uploads'),
    variant_ids: z.array(z.string()).optional().describe('Variant IDs to assign this image to'),
  })).describe('Images to upload'),
}, async (params) => callApi('upload_product_images', params));

server.tool('delete_product_images', 'Removes images from a product', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  image_ids: z.array(z.string()).describe('Image entity IDs to remove'),
}, async (params) => callApi('delete_product_images', params));

server.tool('update_product_media', 'Updates product thumbnail and image ordering', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  thumbnail: z.string().optional().describe('URL for the product thumbnail'),
  images: z.array(z.object({
    url: z.string().describe('Image URL'),
    rank: z.number().optional().describe('Display order rank'),
  })).optional().describe('Product images with ordering'),
}, async (params) => callApi('update_product_media', params));

server.tool('update_variant_images', 'Assigns or unassigns product images to variants', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  assign: z.array(z.object({
    image_id: z.string(),
    variant_ids: z.array(z.string()),
  })).optional().describe('Images to assign to variants'),
  unassign: z.array(z.object({
    image_id: z.string(),
    variant_ids: z.array(z.string()),
  })).optional().describe('Images to unassign from variants'),
}, async (params) => callApi('update_variant_images', params));

// ─── Orders ──────────────────────────────────────────────────────────────────

server.tool('list_orders', 'Lists orders for a store. Use id filter to get specific order details.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more order IDs'),
  status: z.array(z.string()).optional().describe('Filter by one or more order statuses'),
}, async (params) => callApi('list_orders', params));

server.tool('create_fulfillment', 'Creates a fulfillment for an order', {
  store_id: z.string().describe('The ID of the store'),
  order_id: z.string().describe('Order ID to fulfill'),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number(),
  })).optional().describe('Items to fulfill (defaults to all)'),
  tracking_number: z.string().optional(),
  tracking_url: z.string().optional(),
  note: z.string().optional(),
}, async (params) => callApi('create_fulfillment', params));

server.tool('cancel_order', 'Cancels an order', {
  store_id: z.string().describe('The ID of the store'),
  order_id: z.string().describe('Order ID to cancel'),
}, async (params) => callApi('cancel_order', params));

// ─── Inventory ───────────────────────────────────────────────────────────────

server.tool('list_inventory', 'Lists inventory items for a store', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more inventory item IDs'),
}, async (params) => callApi('list_inventory', params));

server.tool('update_inventory', 'Updates stock quantities for one or more inventory items. Accepts id (inventory_item_id) or variant_id.', {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    id: z.string().optional().describe('Inventory item ID (use this OR variant_id)'),
    variant_id: z.string().optional().describe('Product variant ID (resolved to inventory item automatically)'),
    stocked_quantity: z.number().describe('New stock quantity'),
    location_id: z.string().optional(),
  })).describe('Inventory items to update - provide either id or variant_id per entry'),
}, async (params) => callApi('update_inventory', params));

// ─── Stock Locations ─────────────────────────────────────────────────────────

server.tool('list_stock_locations', 'Lists stock locations (warehouses/fulfillment centers) for a store. Returns is_default flag.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more stock location IDs'),
}, async (params) => callApi('list_stock_locations', params));

server.tool('create_stock_locations', 'Creates one or more stock locations. Use set_as_default to make the first created location the store default.', {
  store_id: z.string().describe('The ID of the store'),
  stock_locations: z.array(z.object({
    name: z.string().describe('Location name (e.g. "US East Warehouse")'),
    address: z.object({
      address_1: z.string().optional(),
      city: z.string().optional(),
      country_code: z.string().optional().describe('ISO 2-letter country code'),
      province: z.string().optional(),
      postal_code: z.string().optional(),
    }).optional(),
  })).describe('Stock locations to create'),
  set_as_default: z.boolean().optional().describe('Set the first created location as the store default'),
}, async (params) => callApi('create_stock_locations', params));

server.tool('update_stock_locations', 'Updates one or more stock locations.', {
  store_id: z.string().describe('The ID of the store'),
  stock_locations: z.array(z.object({
    id: z.string().describe('Stock location ID to update'),
    name: z.string().optional(),
    address: z.object({
      address_1: z.string().optional(),
      city: z.string().optional(),
      country_code: z.string().optional(),
      province: z.string().optional(),
      postal_code: z.string().optional(),
    }).optional(),
  })).describe('Stock locations to update'),
}, async (params) => callApi('update_stock_locations', params));

server.tool('delete_stock_locations', 'Deletes one or more stock locations. Cannot delete the store default location.', {
  store_id: z.string().describe('The ID of the store'),
  ids: z.array(z.string()).describe('Stock location IDs to delete'),
}, async (params) => callApi('delete_stock_locations', params));

// ─── Customers ───────────────────────────────────────────────────────────────

server.tool('list_customers', 'Lists customers for a store. Use id filter to get specific customer details.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more customer IDs'),
}, async (params) => callApi('list_customers', params));

// ─── Promotions ──────────────────────────────────────────────────────────────

server.tool('list_promotions', 'Lists promotions for a store. Use id filter to get specific promotion details.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more promotion IDs'),
}, async (params) => callApi('list_promotions', params));

server.tool('create_promotions', 'Creates one or more promotions', {
  store_id: z.string().describe('The ID of the store'),
  promotions: z.array(z.object({
    code: z.string(),
    type: z.enum(['standard', 'buyget']),
    is_automatic: z.boolean().optional(),
    application_method: z.object({
      type: z.enum(['percentage', 'fixed']),
      value: z.number(),
      target_type: z.enum(['order', 'items', 'shipping']).optional(),
    }).optional(),
  })).describe('Promotions to create'),
}, async (params) => callApi('create_promotions', params));

server.tool('update_promotions', 'Updates one or more promotions', {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    id: z.string(),
    code: z.string().optional(),
    is_automatic: z.boolean().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })).describe('Promotions to update'),
}, async (params) => callApi('update_promotions', params));

server.tool('delete_promotions', 'Deletes one or more promotions', {
  store_id: z.string().describe('The ID of the store'),
  promotion_ids: z.array(z.string()).describe('Promotion IDs to delete'),
}, async (params) => callApi('delete_promotions', params));

// ─── Collections ─────────────────────────────────────────────────────────────

server.tool('list_collections', 'Lists collections for a store. Use id filter to get specific collection details.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more collection IDs'),
}, async (params) => callApi('list_collections', params));

server.tool('create_collections', 'Creates one or more collections', {
  store_id: z.string().describe('The ID of the store'),
  collections: z.array(z.object({
    title: z.string(),
    handle: z.string().optional(),
  })).describe('Collections to create'),
}, async (params) => callApi('create_collections', params));

server.tool('update_collections', 'Updates one or more collections', {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    handle: z.string().optional(),
  })).describe('Collections to update'),
}, async (params) => callApi('update_collections', params));

server.tool('delete_collections', 'Deletes one or more collections', {
  store_id: z.string().describe('The ID of the store'),
  collection_ids: z.array(z.string()).describe('Collection IDs to delete'),
}, async (params) => callApi('delete_collections', params));

server.tool('update_collection_products', 'Adds or removes products from a collection', {
  store_id: z.string().describe('The ID of the store'),
  collection_id: z.string().describe('The ID of the collection'),
  add: z.array(z.string()).optional().describe('Product IDs to add'),
  remove: z.array(z.string()).optional().describe('Product IDs to remove'),
}, async (params) => callApi('update_collection_products', params));

// ─── Shipping ────────────────────────────────────────────────────────────────

server.tool('list_shipping_options', 'Lists shipping options for a store', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more shipping option IDs'),
}, async (params) => callApi('list_shipping_options', params));

server.tool('create_shipping_options', 'Creates one or more shipping options', {
  store_id: z.string().describe('The ID of the store'),
  shipping_options: z.array(z.object({
    name: z.string(),
    price_type: z.enum(['flat_rate', 'calculated']).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })).describe('Shipping options to create'),
}, async (params) => callApi('create_shipping_options', params));

server.tool('update_shipping_options', 'Updates one or more shipping options', {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    data: z.record(z.string(), z.any()).optional(),
  })).describe('Shipping options to update'),
}, async (params) => callApi('update_shipping_options', params));

server.tool('delete_shipping_options', 'Deletes one or more shipping options', {
  store_id: z.string().describe('The ID of the store'),
  shipping_option_ids: z.array(z.string()).describe('Shipping option IDs to delete'),
}, async (params) => callApi('delete_shipping_options', params));

// ─── Price Lists ─────────────────────────────────────────────────────────────

server.tool('list_price_lists', 'Lists price lists for a store. Use id filter to get specific price list details.', {
  store_id: z.string().describe('The ID of the store'),
  ...listParams,
  id: z.array(z.string()).optional().describe('Filter by one or more price list IDs'),
}, async (params) => callApi('list_price_lists', params));

server.tool('create_price_lists', 'Creates one or more price lists', {
  store_id: z.string().describe('The ID of the store'),
  price_lists: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(['sale', 'override']).optional(),
    status: z.enum(['active', 'draft']).optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
  })).describe('Price lists to create'),
}, async (params) => callApi('create_price_lists', params));

server.tool('update_price_lists', 'Updates one or more price lists', {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'draft']).optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
  })).describe('Price lists to update'),
}, async (params) => callApi('update_price_lists', params));

server.tool('delete_price_lists', 'Deletes one or more price lists', {
  store_id: z.string().describe('The ID of the store'),
  price_list_ids: z.array(z.string()).describe('Price list IDs to delete'),
}, async (params) => callApi('delete_price_lists', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP stdio server error: ${err}\n`);
  process.exit(1);
});
