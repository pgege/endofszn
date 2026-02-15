import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callApi } from './shared';

const server = new McpServer({ name: 'store-orders', version: '1.0.0' });

server.tool('list_orders', `Lists orders for a store with pagination and optional status filter. Pass id to filter by specific order IDs.

EXAMPLE: list_orders({ store_id: "store_xxx", limit: 20, offset: 0 })
EXAMPLE: list_orders({ store_id: "store_xxx", status: ["pending"], limit: 50 })
EXAMPLE: list_orders({ store_id: "store_xxx", id: ["order_xxx"] })
Response: { orders: [...], count: 120, limit: 20, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more order IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
  status: z.array(z.string()).optional().describe('Filter by one or more order statuses (e.g. pending, completed, canceled)'),
}, async (params) => callApi('list_orders', params));

server.tool('create_fulfillment', `Creates a fulfillment for an order. Can fulfill all items or specific items with optional tracking.

EXAMPLE: { "store_id": "store_xxx", "order_id": "order_1", "tracking_number": "1Z999" }
EXAMPLE: { "store_id": "store_xxx", "order_id": "order_1", "items": [{ "id": "item_1", "quantity": 2 }] }`, {
  store_id: z.string().describe('The ID of the store'),
  order_id: z.string().describe('Order ID to fulfill'),
  items: z.array(z.object({
    id: z.string().describe('Order item ID'),
    quantity: z.number().describe('Quantity to fulfill'),
  })).optional().describe('Items to fulfill (defaults to all)'),
  tracking_number: z.string().optional().describe('Tracking number'),
  tracking_url: z.string().optional().describe('Tracking URL'),
  note: z.string().optional().describe('Fulfillment note'),
}, async (params) => callApi('create_fulfillment', params));

server.tool('cancel_order', `Cancels an order.

EXAMPLE: { "store_id": "store_xxx", "order_id": "order_3" }`, {
  store_id: z.string().describe('The ID of the store'),
  order_id: z.string().describe('Order ID to cancel'),
}, async (params) => callApi('cancel_order', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) main().catch(console.error);

export default server;
