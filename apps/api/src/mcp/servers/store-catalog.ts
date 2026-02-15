import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callApi } from './shared';

const server = new McpServer({ name: 'store-catalog', version: '1.0.0' });

// ─── Products ────────────────────────────────────────────────────────────────

server.tool('list_products', `Lists products for a store with search, filter, sort, and pagination. Use fields='full' to include categories, variants, images, and options. Pass id to filter by specific product IDs.

EXAMPLE: list_products({ store_id: "store_xxx", limit: 50, fields: "full" })
EXAMPLE: list_products({ store_id: "store_xxx", q: "hoodie", status: ["published"], order: "-created_at" })
EXAMPLE: list_products({ store_id: "store_xxx", id: ["prod_xxx"] })
ALWAYS call before creating products to avoid duplicates.`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more product IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
  fields: z.enum(['basics', 'full']).optional().default('basics').describe("'basics' = core fields, 'full' = all relations"),
  status: z.array(z.enum(['draft', 'published'])).optional().describe('Filter by one or more statuses'),
  category_id: z.array(z.string()).optional().describe('Filter by one or more category IDs'),
}, async (params) => callApi('list_products', params));

const productInput = z.object({
  title: z.string().describe('Product title'),
  subtitle: z.string().optional().describe('Short tagline under title'),
  description: z.string().optional().describe('Marketing copy'),
  status: z.enum(['draft', 'published']).optional().describe('Default to "draft"'),
  thumbnail: z.string().optional().describe('Primary display image URL'),
  images: z.array(z.object({
    url: z.string(),
    rank: z.number().optional().describe('Display order, 0 = hero'),
  })).optional(),
  options: z.array(z.object({
    title: z.string().describe('Option name, e.g. "Size", "Color"'),
    values: z.array(z.string()).describe('All option values'),
  })).optional(),
  variants: z.array(z.object({
    title: z.string().describe('Display name, e.g. "Small / Red"'),
    options: z.record(z.string(), z.string()).optional(),
    prices: z.array(z.object({
      amount: z.number().describe('Price in cents'),
      currency_code: z.string(),
    })).optional(),
    sku: z.string().optional(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
    barcode: z.string().optional(),
  })).optional(),
  category_ids: z.array(z.string()).optional().describe('Category IDs. Use leaf categories'),
  metadata: z.object({
    sections: z.array(z.object({
      name: z.string().describe('Section title'),
      content: z.string().describe('Section content (HTML)'),
    })).optional(),
  }).optional().describe('Product metadata including content sections'),
});

server.tool('create_products', `Creates one or more products with options, variants, images, and categories.

Pass an array — use for single or batch creation.

EXAMPLE — single product:
{ "store_id": "store_xxx", "products": [{
  "title": "Premium Heavyweight Hoodie",
  "description": "Ultra-premium heavyweight hoodie.",
  "status": "draft",
  "category_ids": ["cat_hoodies"],
  "options": [{ "title": "Size", "values": ["S", "M", "L"] }],
  "variants": [{ "title": "S", "options": { "Size": "S" }, "prices": [{ "amount": 12999, "currency_code": "usd" }] }]
}]}

PRICING: All amounts in cents. $99.99 = 9999`, {
  store_id: z.string().describe('The ID of the store'),
  products: z.array(productInput).describe('Array of products to create (1 or more)'),
}, async (params) => callApi('create_products', params));

const productUpdateFields = z.object({
  product_id: z.string().describe('The ID of the product to update'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  thumbnail: z.string().optional(),
  images: z.array(z.object({ url: z.string(), rank: z.number().optional() })).optional(),
  category_ids: z.array(z.string()).optional(),
  metadata: z.object({
    sections: z.array(z.object({
      name: z.string().describe('Section title'),
      content: z.string().describe('Section content (HTML)'),
    })).optional(),
  }).optional().describe('Product metadata including content sections'),
});

server.tool('update_products', `Updates one or more products. Supports all fields including metadata sections.

EXAMPLE — single: { "store_id": "store_xxx", "updates": [{ "product_id": "prod_1", "status": "published" }] }
EXAMPLE — batch:  { "store_id": "store_xxx", "updates": [
  { "product_id": "prod_1", "status": "published" },
  { "product_id": "prod_2", "title": "New Title", "metadata": { "sections": [{ "name": "Care", "content": "Machine wash cold" }] } }
]}`, {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(productUpdateFields).describe('Array of product updates (1 or more)'),
}, async (params) => callApi('update_products', params));

server.tool('delete_products', `Deletes one or more products. DESTRUCTIVE.

EXAMPLE: { "store_id": "store_xxx", "product_ids": ["prod_1"] }
EXAMPLE: { "store_id": "store_xxx", "product_ids": ["prod_1", "prod_2", "prod_3"] }`, {
  store_id: z.string().describe('The ID of the store'),
  product_ids: z.array(z.string()).describe('Array of product IDs to delete'),
}, async (params) => callApi('delete_products', params));

// ─── Variants ────────────────────────────────────────────────────────────────

server.tool('list_variants', `Lists all variants for a product including prices, SKUs, and option values. Pass id to filter by specific variant IDs.

EXAMPLE: list_variants({ store_id: "store_xxx", product_id: "prod_xxx" })
EXAMPLE: list_variants({ store_id: "store_xxx", product_id: "prod_xxx", id: ["variant_xxx"] })
Response: { variants: [{ id, title, sku, prices: [...], options: {...} }] }`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  id: z.array(z.string()).optional().describe('Filter by one or more variant IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_variants', params));

server.tool('create_variants', `Creates additional variants for an existing product. Product MUST have options defined.

VARIANT BEST PRACTICES:
- Title format: "OptionValue1 / OptionValue2" matching option order
- options keys MUST exactly match product option titles (case-sensitive)
- Prices in cents`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  variants: z.array(z.object({
    title: z.string().describe('Display name'),
    options: z.record(z.string(), z.string()).optional(),
    prices: z.array(z.object({
      amount: z.number().describe('Price in cents'),
      currency_code: z.string(),
    })).optional(),
    sku: z.string().optional(),
    manage_inventory: z.boolean().optional(),
    allow_backorder: z.boolean().optional(),
    barcode: z.string().optional(),
  })),
}, async (params) => callApi('create_variants', params));

const variantUpdateFields = z.object({
  variant_id: z.string().describe('The ID of the variant to update'),
  title: z.string().optional(),
  price: z.number().optional().describe('Price in cents'),
  sku: z.string().optional(),
  currency_code: z.string().optional(),
  manage_inventory: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  barcode: z.string().optional(),
});

server.tool('update_variants', `Updates one or more variants. Supports price, SKU, inventory settings.

EXAMPLE — single: { "store_id": "s", "product_id": "p", "updates": [{ "variant_id": "v1", "price": 9999 }] }
EXAMPLE — batch:  { "store_id": "s", "product_id": "p", "updates": [
  { "variant_id": "v1", "price": 9999 },
  { "variant_id": "v2", "price": 11999, "sku": "HOODIE-GRY-M" }
]}`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  updates: z.array(variantUpdateFields).describe('Array of variant updates (1 or more)'),
}, async (params) => callApi('update_variants', params));

server.tool('delete_variants', 'Deletes one or more variants.', {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  variant_ids: z.array(z.string()).describe('Array of variant IDs to delete'),
}, async (params) => callApi('delete_variants', params));

// ─── Categories ──────────────────────────────────────────────────────────────

server.tool('list_categories', `Lists all categories with hierarchy. Pass id to filter by specific category IDs. ALWAYS call before creating categories or products.

Returns tree structure showing parent-child relationships.`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more category IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_categories', params));

const categoryInput = z.object({
  name: z.string().describe('Category name'),
  description: z.string().optional(),
  parent_category_id: z.string().optional().describe('Parent ID for nesting. Omit for top-level'),
  handle: z.string().optional().describe('URL slug (auto-generated if omitted)'),
  is_active: z.boolean().optional().describe('Visibility toggle. Default true'),
});

server.tool('create_categories', `Creates one or more categories. Use parent_category_id for hierarchies.

EXAMPLE — single: { "store_id": "store_xxx", "categories": [{ "name": "Hoodies", "parent_category_id": "cat_apparel" }] }
EXAMPLE — batch:  { "store_id": "store_xxx", "categories": [
  { "name": "Apparel" },
  { "name": "Shoes" },
  { "name": "Accessories" }
]}

ALWAYS call list_categories first. Never create duplicates.`, {
  store_id: z.string().describe('The ID of the store'),
  categories: z.array(categoryInput).describe('Array of categories to create (1 or more)'),
}, async (params) => callApi('create_categories', params));

const categoryUpdateFields = z.object({
  category_id: z.string().describe('The ID of the category to update'),
  name: z.string().optional(),
  description: z.string().optional(),
  handle: z.string().optional(),
  is_active: z.boolean().optional(),
});

server.tool('update_categories', `Updates one or more categories.

EXAMPLE: { "store_id": "store_xxx", "updates": [{ "category_id": "cat_1", "name": "New Name" }] }`, {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(categoryUpdateFields).describe('Array of category updates (1 or more)'),
}, async (params) => callApi('update_categories', params));

server.tool('delete_categories', `Deletes one or more categories. DESTRUCTIVE.

EXAMPLE: { "store_id": "store_xxx", "category_ids": ["cat_1", "cat_2"] }`, {
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

server.tool('apply_category_template', 'Applies a pre-built category template to quickly set up a store hierarchy.', {
  store_id: z.string().describe('The ID of the store'),
  template_id: z.string().describe('The ID of the template'),
}, async (params) => callApi('apply_category_template', params));

server.tool('bulk_categorize_products', `Bulk assigns products to categories.

EXAMPLE: { "store_id": "store_xxx", "assignments": [
  { "product_id": "prod_1", "category_ids": ["cat_hoodies"] },
  { "product_id": "prod_2", "category_ids": ["cat_tees"] }
]}`, {
  store_id: z.string().describe('The ID of the store'),
  assignments: z.array(z.object({
    product_id: z.string(),
    category_ids: z.array(z.string()),
  })),
}, async (params) => callApi('bulk_categorize_products', params));

server.tool('list_uncategorized_products', 'Lists products not assigned to any category. Pass id to filter by specific product IDs.', {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more product IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_uncategorized_products', params));

// ─── Product options ─────────────────────────────────────────────────────────

server.tool('update_product_options', `Updates one or more product options. Supports title and values.

EXAMPLE — single: { "store_id": "store_xxx", "product_id": "prod_xxx", "updates": [{ "option_id": "opt_color", "title": "Color", "values": ["Black", "Grey"] }] }
EXAMPLE — batch: { "store_id": "store_xxx", "product_id": "prod_xxx", "updates": [
  { "option_id": "opt_size", "values": ["S", "M", "L", "XL"] },
  { "option_id": "opt_color", "values": ["Black", "Grey", "Navy"] }
] }`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  updates: z.array(z.object({
    option_id: z.string().describe('The ID of the option to update'),
    title: z.string().optional().describe('Option title'),
    values: z.array(z.string()).optional().describe('Option values'),
  })).describe('Array of option updates (1 or more)'),
}, async (params) => callApi('update_product_options', params));

// ─── Inventory ────────────────────────────────────────────────────────────────

server.tool('list_inventory', `Lists inventory items (variants with stock levels) for a store. Each item includes inventory_item_id (needed for updates) and variant_id.

EXAMPLE: list_inventory({ store_id: "store_xxx", limit: 50, offset: 0 })
Response: { inventory_items: [{ product_id, product_title, variant_id, variant_title, sku, inventory_item_id, stocked_quantity, reserved_quantity, available_quantity }], count: 100, limit: 50, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more inventory item IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_inventory', params));

server.tool('update_inventory', `Updates stock quantities for one or more inventory items. You can identify items by inventory_item_id OR variant_id.

EXAMPLE using inventory_item_id: { "store_id": "store_xxx", "updates": [{ "id": "iitem_1", "stocked_quantity": 100 }] }
EXAMPLE using variant_id: { "store_id": "store_xxx", "updates": [{ "variant_id": "variant_01ABC", "stocked_quantity": 100 }] }
Response: { inventory_items: [...] }`, {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(z.object({
    id: z.string().optional().describe('Inventory item ID (use this OR variant_id)'),
    variant_id: z.string().optional().describe('Product variant ID (resolved to inventory item automatically)'),
    stocked_quantity: z.number().describe('New stock quantity'),
    location_id: z.string().optional().describe('Location ID (defaults to first location)'),
  })).describe('Inventory items to update - provide either id or variant_id per entry'),
}, async (params) => callApi('update_inventory', params));

// ─── Collections ──────────────────────────────────────────────────────────────

server.tool('list_collections', `Lists product collections for a store with pagination. Pass id to filter by specific collection IDs.

EXAMPLE: list_collections({ store_id: "store_xxx", limit: 20, offset: 0 })
EXAMPLE: list_collections({ store_id: "store_xxx", id: ["pcol_xxx"] })
Response: { collections: [...], count: 8, limit: 20, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more collection IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_collections', params));

const collectionInput = z.object({
  title: z.string().describe('Collection title'),
  handle: z.string().optional().describe('URL handle (auto-generated if omitted)'),
});

const collectionUpdateFields = z.object({
  id: z.string().describe('Collection ID to update'),
  title: z.string().optional().describe('Collection title'),
  handle: z.string().optional().describe('URL handle'),
});

server.tool('create_collections', `Creates one or more collections.

EXAMPLE: { "store_id": "store_xxx", "collections": [{ "title": "Summer Collection" }] }`, {
  store_id: z.string().describe('The ID of the store'),
  collections: z.array(collectionInput).describe('Collections to create'),
}, async (params) => callApi('create_collections', params));

server.tool('update_collections', `Updates one or more collections.

EXAMPLE: { "store_id": "store_xxx", "updates": [{ "id": "pcol_1", "title": "Updated Title" }] }`, {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(collectionUpdateFields).describe('Collections to update'),
}, async (params) => callApi('update_collections', params));

server.tool('delete_collections', `Deletes one or more collections.

EXAMPLE: { "store_id": "store_xxx", "collection_ids": ["pcol_old"] }`, {
  store_id: z.string().describe('The ID of the store'),
  collection_ids: z.array(z.string()).describe('Collection IDs to delete'),
}, async (params) => callApi('delete_collections', params));

server.tool('update_collection_products', `Adds or removes products from a collection. Only products belonging to the store can be added.

EXAMPLE: { "store_id": "store_xxx", "collection_id": "pcol_xxx", "add": ["prod_1", "prod_2"], "remove": ["prod_3"] }
Response: { collection: { id, title, products: [...] } }`, {
  store_id: z.string().describe('The ID of the store'),
  collection_id: z.string().describe('The ID of the collection'),
  add: z.array(z.string()).optional().describe('Product IDs to add'),
  remove: z.array(z.string()).optional().describe('Product IDs to remove'),
}, async (params) => callApi('update_collection_products', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP store-catalog server error: ${err}\n`);
  process.exit(1);
});
