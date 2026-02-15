import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { callApi } from './shared';

const server = new McpServer({ name: 'store-media', version: '1.0.0' });

server.tool('upload_product_images', `Uploads chat attachments to permanent storage and adds them to a product. Supports per-image variant assignment.

Use list_attachments to get attachment IDs first.

EXAMPLE — Upload and add to product only:
{ "store_id": "store_xxx", "product_id": "prod_xxx", "images": [{ "attachment_id": "uuid-1" }, { "attachment_id": "uuid-2" }] }

EXAMPLE — Upload with per-image variant assignment:
{ "store_id": "store_xxx", "product_id": "prod_xxx", "images": [
  { "attachment_id": "uuid-1", "variant_ids": ["var_black_s", "var_black_m"] },
  { "attachment_id": "uuid-2", "variant_ids": ["var_grey_s", "var_grey_m"] }
]}

Returns: { images: [{ id: "img_xxx", attachment_id: "uuid-1", filename: "black_front.jpg", assigned_variants: ["var_black_s", "var_black_m"] }, ...] }`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  images: z.array(z.object({
    attachment_id: z.string().describe('Attachment ID from list_attachments'),
    variant_ids: z.array(z.string()).optional().describe('Variant IDs to assign this specific image to'),
  })).describe('Images to upload with optional per-image variant assignments'),
}, async (params) => callApi('upload_product_images', params));

server.tool('delete_product_images', `Removes images from a product by image entity ID.

EXAMPLE: { "store_id": "store_xxx", "product_id": "prod_xxx", "image_ids": ["img_001", "img_002"] }

This also removes the images from any variants they were assigned to.`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  image_ids: z.array(z.string()).describe('Image entity IDs to remove'),
}, async (params) => callApi('delete_product_images', params));

server.tool('update_variant_images', `Assigns or unassigns existing product images across multiple variants in a single call. Images must already exist on the product (via upload_product_images).

NOTE: "assign" is ADDITIVE — it does not remove existing images from the variant. Use "unassign" to explicitly remove images. To check current assignments first, use get_variant_images.

EXAMPLE — Assign images to variants by color:
{ "store_id": "store_xxx", "product_id": "prod_xxx", "assign": [
  { "image_id": "img_001", "variant_ids": ["var_black_s", "var_black_m"] },
  { "image_id": "img_002", "variant_ids": ["var_grey_s", "var_grey_m"] }
]}

EXAMPLE — Reassign (unassign from wrong variant, assign to correct one):
{ "store_id": "store_xxx", "product_id": "prod_xxx",
  "unassign": [{ "image_id": "img_001", "variant_ids": ["var_grey_s"] }],
  "assign": [{ "image_id": "img_001", "variant_ids": ["var_black_s"] }]
}

BEST PRACTICE:
- Group by color: all Black shots → all Black variants, all Grey → Grey variants
- First image assigned = variant thumbnail (shown in color selector)`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  assign: z.array(z.object({
    image_id: z.string().describe('Image entity ID (img_xxx) to assign'),
    variant_ids: z.array(z.string()).describe('Variant IDs to assign this image to'),
  })).optional().describe('Images to assign to variants (additive, does not remove existing)'),
  unassign: z.array(z.object({
    image_id: z.string().describe('Image entity ID (img_xxx) to unassign'),
    variant_ids: z.array(z.string()).describe('Variant IDs to unassign this image from'),
  })).optional().describe('Images to unassign from variants'),
}, async (params) => callApi('update_variant_images', params));

server.tool('update_product_media', `Updates product-level media: thumbnail and gallery images.

EXAMPLE — Set thumbnail:
{ "store_id": "store_xxx", "product_id": "prod_xxx", "thumbnail": "img_001" }

FIELDS:
- thumbnail: Image entity ID for product cards and search results
- images: Gallery image ordering`, {
  store_id: z.string().describe('The ID of the store'),
  product_id: z.string().describe('The ID of the product'),
  thumbnail: z.string().optional().describe('Image entity ID or URL for primary display image'),
  images: z.array(z.object({
    url: z.string(),
    rank: z.number().optional().describe('Display order, 0 = hero'),
  })).optional().describe('Product gallery images'),
}, async (params) => callApi('update_product_media', params));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`MCP store-media server error: ${err}\n`);
  process.exit(1);
});
