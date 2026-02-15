import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callApi } from './shared';

const server = new McpServer({ name: 'store-core', version: '1.0.0' });

server.tool('list_stores', `Lists all stores for the vendor. Use this first to discover store IDs before any other operations. Pass id to filter by specific store IDs for detailed info.

EXAMPLE: list_stores()
EXAMPLE: list_stores({ id: ["store_xxx"] })
Response: { stores: [{ id: "store_xxx", name: "EndOfSzn Streetwear", default_currency_code: "usd", is_published: true, ... }] }`, {
  id: z.array(z.string()).optional().describe('Filter by one or more store IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_stores', params ?? {}));

const storeInput = z.object({
  name: z.string().describe('The name of the store'),
  description: z.string().optional().describe('Store description for SEO and about pages'),
  tagline: z.string().optional().describe('Short brand slogan shown in store header/SEO'),
  default_currency_code: z.string().optional().describe('ISO currency code, e.g. "usd"'),
});

server.tool('create_stores', `Creates one or more stores with brand identity, contact info, and business details.

EXAMPLE:
{ "stores": [{ "name": "EndOfSzn Streetwear", "description": "Premium streetwear for the culture", "tagline": "Where seasons end and style begins", "default_currency_code": "usd" }] }`, {
  stores: z.array(storeInput).describe('Array of stores to create'),
}, async (params) => callApi('create_stores', params));

const storeUpdateFields = z.object({
  store_id: z.string().describe('The ID of the store to update'),
  name: z.string().optional().describe('Store name'),
  description: z.string().optional().describe('Store description'),
  tagline: z.string().optional().describe('Short brand slogan'),
  default_currency_code: z.string().optional().describe('ISO currency code'),
  logo_url: z.string().optional().describe('Store logo image URL'),
  banner_url: z.string().optional().describe('Store banner image URL'),
  contact_email: z.string().optional().describe('Contact email address'),
  contact_phone: z.string().optional().describe('Contact phone number'),
  address_street: z.string().optional().describe('Street address'),
  address_city: z.string().optional().describe('City'),
  address_state: z.string().optional().describe('State/province'),
  address_country: z.string().optional().describe('Country'),
  address_postal_code: z.string().optional().describe('Postal/zip code'),
  website_url: z.string().optional().describe('Website URL'),
  instagram_url: z.string().optional().describe('Instagram profile URL'),
  twitter_url: z.string().optional().describe('Twitter/X profile URL'),
  facebook_url: z.string().optional().describe('Facebook page URL'),
  tiktok_url: z.string().optional().describe('TikTok profile URL'),
  shipping_policy: z.string().optional().describe('Shipping policy (rich text/HTML)'),
  returns_policy: z.string().optional().describe('Returns policy (rich text/HTML)'),
  warranty_policy: z.string().optional().describe('Warranty policy (rich text/HTML)'),
  is_published: z.boolean().optional().describe('Whether store is live and visible'),
  accepts_orders: z.boolean().optional().describe('Whether store accepts new orders'),
});

server.tool('update_stores', `Updates one or more stores. Supports ALL profile fields: name, contact info, address, social links, policies, publish status.

Pass an array of updates — use for single or batch operations.

EXAMPLE — single store:
{ "updates": [{ "store_id": "store_xxx", "is_published": true, "contact_email": "hello@brand.com" }] }

EXAMPLE — multiple stores:
{ "updates": [
  { "store_id": "store_1", "name": "Brand A", "is_published": true },
  { "store_id": "store_2", "name": "Brand B", "accepts_orders": false }
]}

ALL FIELDS: name, description, tagline, default_currency_code, logo_url, banner_url,
contact_email, contact_phone, address_street/city/state/country/postal_code,
website_url, instagram_url, twitter_url, facebook_url, tiktok_url,
shipping_policy, returns_policy, warranty_policy, is_published, accepts_orders`, {
  updates: z.array(storeUpdateFields).describe('Array of store updates (1 or more)'),
}, async (params) => callApi('update_stores', params));

server.tool('delete_stores', `Deletes one or more stores. DESTRUCTIVE — cannot be undone.

EXAMPLE: { "store_ids": ["store_xxx"] }
EXAMPLE: { "store_ids": ["store_1", "store_2"] }`, {
  store_ids: z.array(z.string()).describe('Array of store IDs to delete'),
}, async (params) => callApi('delete_stores', params));

// ─── Shipping ─────────────────────────────────────────────────────────────────

server.tool('list_shipping_options', `Lists shipping options for a store with pagination. Pass id to filter by specific shipping option IDs.

EXAMPLE: list_shipping_options({ store_id: "store_xxx", limit: 20, offset: 0 })
Response: { shipping_options: [...], count: 5, limit: 20, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more shipping option IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_shipping_options', params));

const shippingOptionInput = z.object({
  name: z.string().describe('Shipping option name'),
  price_type: z.enum(['flat_rate', 'calculated']).optional().default('flat_rate').describe('Pricing type'),
  data: z.record(z.string(), z.any()).optional().describe('Shipping option config data'),
});

const shippingOptionUpdateFields = z.object({
  id: z.string().describe('Shipping option ID to update'),
  name: z.string().optional().describe('Shipping option name'),
  data: z.record(z.string(), z.any()).optional().describe('Shipping option config data'),
});

server.tool('create_shipping_options', `Creates one or more shipping options.

EXAMPLE: { "store_id": "store_xxx", "shipping_options": [{ "name": "Standard Shipping", "price_type": "flat_rate" }] }`, {
  store_id: z.string().describe('The ID of the store'),
  shipping_options: z.array(shippingOptionInput).describe('Shipping options to create'),
}, async (params) => callApi('create_shipping_options', params));

server.tool('update_shipping_options', `Updates one or more shipping options.

EXAMPLE: { "store_id": "store_xxx", "updates": [{ "id": "so_1", "name": "Economy Shipping" }] }`, {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(shippingOptionUpdateFields).describe('Shipping options to update'),
}, async (params) => callApi('update_shipping_options', params));

server.tool('delete_shipping_options', `Deletes one or more shipping options.

EXAMPLE: { "store_id": "store_xxx", "shipping_option_ids": ["so_old"] }`, {
  store_id: z.string().describe('The ID of the store'),
  shipping_option_ids: z.array(z.string()).describe('Shipping option IDs to delete'),
}, async (params) => callApi('delete_shipping_options', params));

// ─── Stock Locations ─────────────────────────────────────────────────────────

server.tool('list_stock_locations', `Lists stock locations (warehouses/fulfillment centers) for a store. Returns is_default flag indicating the store's default location.

EXAMPLE: list_stock_locations({ store_id: "store_xxx" })
EXAMPLE: list_stock_locations({ store_id: "store_xxx", id: ["sloc_xxx"] })
Response: { stock_locations: [{ id: "sloc_xxx", name: "US East Warehouse", is_default: true, address: { city: "New York", country_code: "us" }, created_at: "..." }], count: 2, limit: 50, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more stock location IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search by location name or city'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_stock_locations', params));

const stockLocationInput = z.object({
  name: z.string().describe('Location name (e.g. "US East Warehouse")'),
  address: z.object({
    address_1: z.string().optional().describe('Street address'),
    city: z.string().optional().describe('City'),
    country_code: z.string().optional().describe('ISO 2-letter country code (e.g. "us")'),
    province: z.string().optional().describe('State/province'),
    postal_code: z.string().optional().describe('Postal/zip code'),
  }).optional().describe('Physical address of the location'),
});

const stockLocationUpdateFields = z.object({
  id: z.string().describe('Stock location ID to update'),
  name: z.string().optional().describe('Location name'),
  address: z.object({
    address_1: z.string().optional(),
    city: z.string().optional(),
    country_code: z.string().optional(),
    province: z.string().optional(),
    postal_code: z.string().optional(),
  }).optional().describe('Updated address fields'),
});

server.tool('create_stock_locations', `Creates one or more stock locations. Use set_as_default to make the first created location the store's default for inventory operations.

EXAMPLE: { "store_id": "store_xxx", "stock_locations": [{ "name": "US East Warehouse", "address": { "city": "New York", "country_code": "us" } }], "set_as_default": true }
Response: { stock_locations: [{ id: "sloc_xxx", name: "US East Warehouse", ... }] }`, {
  store_id: z.string().describe('The ID of the store'),
  stock_locations: z.array(stockLocationInput).describe('Stock locations to create'),
  set_as_default: z.boolean().optional().describe('Set the first created location as the store default'),
}, async (params) => callApi('create_stock_locations', params));

server.tool('update_stock_locations', `Updates one or more stock locations.

EXAMPLE: { "store_id": "store_xxx", "stock_locations": [{ "id": "sloc_xxx", "name": "US East Fulfillment Center" }] }
Response: { stock_locations: [...] }`, {
  store_id: z.string().describe('The ID of the store'),
  stock_locations: z.array(stockLocationUpdateFields).describe('Stock locations to update'),
}, async (params) => callApi('update_stock_locations', params));

server.tool('delete_stock_locations', `Deletes one or more stock locations. Cannot delete the store's default location — change the default first.

EXAMPLE: { "store_id": "store_xxx", "ids": ["sloc_old"] }
Response: { deleted: ["sloc_old"] }`, {
  store_id: z.string().describe('The ID of the store'),
  ids: z.array(z.string()).describe('Stock location IDs to delete'),
}, async (params) => callApi('delete_stock_locations', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP store-core server error: ${err}\n`);
  process.exit(1);
});
