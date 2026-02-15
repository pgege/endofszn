import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callApi } from './shared';

const server = new McpServer({ name: 'store-promotions', version: '1.0.0' });

server.tool('list_promotions', `Lists promotions for a store with pagination. Pass id to filter by specific promotion IDs.

EXAMPLE: list_promotions({ store_id: "store_xxx", limit: 20, offset: 0 })
EXAMPLE: list_promotions({ store_id: "store_xxx", id: ["promo_xxx"] })
Response: { promotions: [...], count: 42, limit: 20, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more promotion IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_promotions', params));

const promotionInput = z.object({
  code: z.string().describe('Promotion code'),
  type: z.enum(['standard', 'buyget']).describe('Promotion type'),
  is_automatic: z.boolean().optional().default(false).describe('Whether applied automatically'),
  application_method: z.object({
    type: z.enum(['percentage', 'fixed']).describe('Discount type'),
    value: z.number().describe('Discount value'),
    target_type: z.enum(['order', 'items', 'shipping']).optional().describe('What the discount applies to'),
  }).optional().describe('How the promotion is applied'),
});

const promotionUpdateFields = z.object({
  id: z.string().describe('Promotion ID to update'),
  code: z.string().optional().describe('Promotion code'),
  is_automatic: z.boolean().optional().describe('Whether applied automatically'),
  status: z.enum(['active', 'inactive']).optional().describe('Promotion status'),
});

server.tool('create_promotions', `Creates one or more promotions.

EXAMPLE: { "store_id": "store_xxx", "promotions": [{ "code": "SUMMER20", "type": "standard", "application_method": { "type": "percentage", "value": 20 } }] }`, {
  store_id: z.string().describe('The ID of the store'),
  promotions: z.array(promotionInput).describe('Promotions to create'),
}, async (params) => callApi('create_promotions', params));

server.tool('update_promotions', `Updates one or more promotions.

EXAMPLE: { "store_id": "store_xxx", "updates": [{ "id": "promo_1", "is_automatic": true }] }`, {
  store_id: z.string().describe('The ID of the store'),
  updates: z.array(promotionUpdateFields).describe('Promotions to update'),
}, async (params) => callApi('update_promotions', params));

server.tool('delete_promotions', `Deletes one or more promotions.

EXAMPLE: { "store_id": "store_xxx", "promotion_ids": ["promo_old"] }`, {
  store_id: z.string().describe('The ID of the store'),
  promotion_ids: z.array(z.string()).describe('Promotion IDs to delete'),
}, async (params) => callApi('delete_promotions', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) main().catch(console.error);

export default server;
