import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SIMPLE_CHAT_ID = '00000000-0000-0000-0000-000000000001';
const SMART_ROUTER_ID = '00000000-0000-0000-0000-000000000002';
const GLOBAL_VENDOR_ID = '__global__';

const simpleChat = {
  name: 'simple-chat',
  agents: {
    assistant: {
      description: 'General e-commerce assistant',
      system_prompt:
        'You are a helpful e-commerce assistant.\nUse send_text to stream your response to the user.',
      history_group: 'chat',
      input_schema: { type: 'string', description: "User's message" },
      output_schema: { type: 'string', description: "Assistant's response" },
      mcp_servers: ['messaging'],
    },
  },
  steps: [
    {
      id: 'respond',
      agent: 'assistant',
      input: '${{ trigger.message }}',
    },
  ],
  output: '${{ steps.respond.output }}',
};

const smartRouter = {
  name: 'smart-router',
  agents: {
    router: {
      description: 'Classify user intent for routing',
      system_prompt:
        "Classify the user's intent. Respond with exactly one word:\nproduct, order, or general.",
      history_group: null,
      input_schema: {
        type: 'string',
        description: "User's message to classify",
      },
      output_schema: {
        type: 'string',
        description: 'One of: product, order, general',
      },
    },
    'product-expert': {
      description: 'Product specialist',
      system_prompt: 'You are a product specialist. Use send_text to respond.',
      history_group: 'chat',
      input_schema: { type: 'string', description: 'Product question' },
      output_schema: { type: 'string', description: 'Product answer' },
      mcp_servers: ['messaging', 'medusa'],
    },
    'order-expert': {
      description: 'Order specialist',
      system_prompt: 'You are an order specialist. Use send_text to respond.',
      history_group: 'chat',
      input_schema: { type: 'string', description: 'Order question' },
      output_schema: { type: 'string', description: 'Order answer' },
      mcp_servers: ['messaging'],
    },
    'general-assistant': {
      description: 'General assistant',
      system_prompt: 'You are a general assistant. Use send_text to respond.',
      history_group: 'chat',
      input_schema: { type: 'string', description: 'General question' },
      output_schema: { type: 'string', description: 'General answer' },
      mcp_servers: ['messaging'],
    },
  },
  steps: [
    {
      id: 'route',
      agent: 'router',
      input: '${{ trigger.message }}',
    },
    {
      id: 'handle-product',
      agent: 'product-expert',
      input: '${{ trigger.message }}',
      if: "${{ steps.route.output == 'product' }}",
      needs: ['route'],
    },
    {
      id: 'handle-order',
      agent: 'order-expert',
      input: '${{ trigger.message }}',
      if: "${{ steps.route.output == 'order' }}",
      needs: ['route'],
    },
    {
      id: 'handle-general',
      agent: 'general-assistant',
      input: '${{ trigger.message }}',
      if: "${{ steps.route.output == 'general' }}",
      needs: ['route'],
    },
  ],
  output:
    '${{ steps.handle-product.output }}${{ steps.handle-order.output }}${{ steps.handle-general.output }}',
};

async function main() {
  await prisma.workflow.upsert({
    where: { id: SIMPLE_CHAT_ID },
    update: {
      name: 'Simple Chat',
      description: 'Single agent responding to user messages with streaming.',
      definition: simpleChat,
    },
    create: {
      id: SIMPLE_CHAT_ID,
      vendorId: GLOBAL_VENDOR_ID,
      name: 'Simple Chat',
      description: 'Single agent responding to user messages with streaming.',
      definition: simpleChat,
    },
  });

  await prisma.workflow.upsert({
    where: { id: SMART_ROUTER_ID },
    update: {
      name: 'Smart Router',
      description:
        'Classify user intent then route to a specialized agent using conditions.',
      definition: smartRouter,
    },
    create: {
      id: SMART_ROUTER_ID,
      vendorId: GLOBAL_VENDOR_ID,
      name: 'Smart Router',
      description:
        'Classify user intent then route to a specialized agent using conditions.',
      definition: smartRouter,
    },
  });

  console.log('Seeded example workflows');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
