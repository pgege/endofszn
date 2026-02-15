import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callApi } from './shared';

const server = new McpServer({ name: 'store-customers', version: '1.0.0' });

server.tool('list_customers', `Lists customers who have placed orders at this store, with search and pagination. Pass id to filter by specific customer IDs.

EXAMPLE: list_customers({ store_id: "store_xxx", limit: 20, offset: 0 })
EXAMPLE: list_customers({ store_id: "store_xxx", q: "john" })
EXAMPLE: list_customers({ store_id: "store_xxx", id: ["cus_xxx"] })
Response: { customers: [{ id, email, first_name, last_name, phone, has_account, created_at }], count: 50, limit: 20, offset: 0 }`, {
  store_id: z.string().describe('The ID of the store'),
  id: z.array(z.string()).optional().describe('Filter by one or more customer IDs'),
  limit: z.number().optional().describe('Max items per page'),
  offset: z.number().optional().describe('Pagination offset'),
  q: z.string().optional().describe('Search query'),
  order: z.string().optional().describe('Sort field, prefix with - for descending (e.g. -created_at)'),
}, async (params) => callApi('list_customers', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) main().catch(console.error);

export default server;
