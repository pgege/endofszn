import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callApi } from './shared';

const server = new McpServer({ name: 'store-pricing', version: '1.0.0' });

server.tool('list_price_lists', `Lists price lists for a store with pagination. Pass id to filter by specific price list IDs.

EXAMPLE: list_price_lists({ store_id: "store_xxx", limit: 20, offset: 0 })
EXAMPLE: list_price_lists({ store_id: "store_xxx", id: ["pl_xxx"] })
Response: { price_lists: [...], count: 5, limit: 20, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more price list IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_price_lists', params));

const priceListInput = z.object({
  title: z.string().describe('Price list name'),
  description: z.string().optional().describe('Description'),
  type: z.enum(['sale', 'override']).optional().default('sale').describe('Price list type'),
  status: z.enum(['active', 'draft']).optional().default('draft').describe('Status'),
  starts_at: z.string().optional().describe('Start date (ISO)'),
  ends_at: z.string().optional().describe('End date (ISO)'),
});

const priceListUpdateFields = z.object({
  id: z.string().describe('Price list ID to update'),
  title: z.string().optional().describe('Price list name'),
  description: z.string().optional().describe('Description'),
  status: z.enum(['active', 'draft']).optional().describe('Status'),
  starts_at: z.string().optional().describe('Start date (ISO)'),
  ends_at: z.string().optional().describe('End date (ISO)'),
});

server.tool('create_price_lists', `Creates one or more price lists.

EXAMPLE: { "store_id": "store_xxx", "price_lists": [{ "title": "VIP Pricing", "type": "override", "status": "active" }] }`, {
  store_id: z.string().describe('The ID of the store'),
  price_lists: z.array(priceListInput).describe('Price lists to create'),
}, async (params) => callApi('create_price_lists', params));

server.tool('update_price_lists', `Updates one or more price lists.

EXAMPLE: { "store_id": "store_xxx", "updates": [{ "id": "pl_1", "status": "active" }] }`, {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(priceListUpdateFields).describe('Price lists to update'),
}, async (params) => callApi('update_price_lists', params));

server.tool('delete_price_lists', `Deletes one or more price lists.

EXAMPLE: { "store_id": "store_xxx", "price_list_ids": ["pl_old"] }`, {
  store_id: z.string().describe('The ID of the store'),
  price_list_ids: z.array(z.string()).describe('Price list IDs to delete'),
}, async (params) => callApi('delete_price_lists', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) main().catch(console.error);

export default server;
