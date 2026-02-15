import type { WorkflowExample } from '@/types/workflow';

const NAV_HINTS_OUTPUT_SCHEMA = {
  type: 'object' as const,
  description: 'Response with navigation hints',
  properties: {
    type: { type: 'string', description: "Always 'nav_hints'" },
    response: { type: 'string', description: 'The text response' },
    hints: { type: 'array', description: 'Navigation hints for UI deep-links' },
  },
  required: ['type', 'response'],
};

const NAV_HINTS_PROMPT = `NAVIGATION HINTS (MANDATORY after mutations):
After ANY create/update/delete operation, include a "hints" array in your output linking to affected resources.
Available routes: \${{ context.app_routes }}
Example: { "route_key": "stores.products.detail", "params": { "id": "<store_id>", "productId": "<product_id>" }, "label": "View Product" }`;

export const examples: WorkflowExample[] = [
  {
    name: 'Storefront Assistant',
    description:
      'Single all-in-one agent with full store, catalog, media, orders, promotions, and pricing capabilities.',
    category: 'Basics',
    workflow: {
      name: 'storefront-assistant',
      input_schema: { type: 'string', description: 'User message' },
      output_schema: NAV_HINTS_OUTPUT_SCHEMA,
      agents: {
        assistant: {
          description: 'Full-stack storefront agent with all store management tools',
          system_prompt: `You are a senior e-commerce storefront manager. You have FULL control over every aspect of the store.

TOOL OVERVIEW:
- Store: list_stores, create_stores, update_stores, delete_stores
- Shipping: list_shipping_options, create_shipping_options, update_shipping_options, delete_shipping_options
- Products: list_products, create_products, update_products, delete_products
- Variants: list_variants, create_variants, update_variants, delete_variants
- Categories: list_categories, create_categories, update_categories, delete_categories
- Category utils: list_category_templates, apply_category_template, bulk_categorize_products, list_uncategorized_products
- Options: update_product_options
- Collections: list_collections, create_collections, update_collections, delete_collections, update_collection_products
- Inventory: list_inventory, update_inventory
- Media: upload_product_images, delete_product_images, update_variant_images, update_product_media
- Orders: list_orders, create_fulfillment, cancel_order
- Customers: list_customers
- Promotions: list_promotions, create_promotions, update_promotions, delete_promotions
- Pricing: list_price_lists, create_price_lists, update_price_lists, delete_price_lists

CRITICAL RULES:
1. PRICES IN CENTS: $99.99 = 9999, $129.99 = 12999. NEVER use decimal dollars.
2. BATCH-FIRST: All mutation tools accept arrays. Use create_products with multiple items, update_stores with multiple updates.
3. PRE-FLIGHT: ALWAYS call list_categories/list_products before creating to avoid duplicates.
4. POST-VERIFY: After mutations, call list_products with id filter and fields='full' to confirm.
5. CATEGORIES: Build top-down (departments -> types -> collections). Assign products to LEAF categories only.
6. STATUS: Default to "draft" unless explicitly told to publish.

IMAGE WORKFLOW:
1. When the user uploads images, call \`list_attachments\` to get attachment IDs.
2. Use \`upload_product_images\` with attachment_id (NOT URLs). Optionally assign to variants per-image.
3. Use \`update_variant_images\` to assign/unassign images across variants. "assign" is ADDITIVE.
4. Use \`delete_product_images\` to remove images.

CLARIFICATION:
- Use the \`clarify\` tool for ALL questions. NEVER type questions as plain text.
- Provide 3-4 expert suggestions as options. The user picks one or types custom text.

${NAV_HINTS_PROMPT}`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: "User's message" },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
          mcp_servers: ['store-core', 'store-catalog', 'store-media', 'store-orders', 'store-customers', 'store-promotions', 'store-pricing'],
        },
      },
      steps: [
        {
          id: 'respond',
          agent: 'assistant',
          input: '${{ trigger.message }}',
          attachments: true,
        },
      ],
      output: '${{ steps.respond.output }}',
    },
  },
  {
    name: 'Storefront Router',
    description:
      'Classifies user intent then routes to a specialized agent (store, catalog, orders, promotions, media, or general) with navigation hints.',
    category: 'Basics',
    workflow: {
      name: 'storefront-router',
      input_schema: { type: 'string', description: 'User message' },
      output_schema: NAV_HINTS_OUTPUT_SCHEMA,
      agents: {
        router: {
          description: 'Classify user intent for routing to the right specialist',
          system_prompt: `Classify the user's intent into exactly one category. Respond with ONLY one word:
- store: store profile, settings, contact info, social links, policies, publish status, shipping options
- catalog: products, variants, categories, collections, inventory, options
- orders: orders, fulfillments, cancellations, customer inquiries
- promotions: discounts, promo codes, price lists, sale pricing
- media: images, uploads, thumbnails, variant image assignments
- general: greetings, questions about capabilities, anything else

Respond with exactly one word: store, catalog, orders, promotions, media, or general.`,
          model: 'anthropic/claude-3.5-haiku',
          history_group: null,
          input_schema: { type: 'string', description: "User's message to classify" },
          output_schema: { type: 'string', description: 'One of: store, catalog, orders, promotions, media, general' },
        },
        'store-specialist': {
          description: 'Handles store profile, settings, shipping, and configuration',
          system_prompt: `You manage store profiles and shipping. Tools: list_stores, create_stores, update_stores, delete_stores, list_shipping_options, create_shipping_options, update_shipping_options, delete_shipping_options.

update_stores supports ALL fields: name, description, tagline, currency, logo_url, banner_url, contact_email, contact_phone, full address, social links (instagram, twitter, facebook, tiktok), policies (shipping, returns, warranty), is_published, accepts_orders.

Use \`clarify\` for all questions. Prices in cents. All tools accept arrays for batch ops.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'Store-related request' },
          output_schema: { type: 'string', description: 'Response' },
          mcp_servers: ['store-core'],
        },
        'catalog-specialist': {
          description: 'Handles products, variants, categories, collections, and inventory',
          system_prompt: `You manage the product catalog. Tools: list_products, create_products, update_products, delete_products, list_variants, create_variants, update_variants, delete_variants, list_categories, create_categories, update_categories, delete_categories, list_category_templates, apply_category_template, bulk_categorize_products, list_uncategorized_products, update_product_options, list_collections, create_collections, update_collections, delete_collections, update_collection_products, list_inventory, update_inventory.

RULES: Prices in CENTS ($99.99 = 9999). Default status "draft". Build categories top-down, assign to leaf. ALWAYS list before create to avoid duplicates. All tools accept arrays. Use \`clarify\` for questions.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'Catalog request' },
          output_schema: { type: 'string', description: 'Response' },
          mcp_servers: ['store-catalog'],
        },
        'order-specialist': {
          description: 'Handles orders, fulfillments, and customer queries',
          system_prompt: `You manage orders and customers. Tools: list_orders (with status filter), create_fulfillment, cancel_order, list_customers.

ORDER WORKFLOWS:
- Viewing orders: list_orders with optional status filter (pending, completed, canceled)
- Fulfilling: create_fulfillment with order_id, optional items array (defaults to all), tracking_number, tracking_url
- Canceling: cancel_order with order_id
- Customer lookup: list_customers with search query

Use \`clarify\` for questions. Be careful with fulfillments and cancellations — these are irreversible.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'Order/customer request' },
          output_schema: { type: 'string', description: 'Response' },
          mcp_servers: ['store-orders', 'store-customers'],
        },
        'promotions-specialist': {
          description: 'Handles promotions, discounts, and price lists',
          system_prompt: `You manage promotions and pricing. Tools: list_promotions, create_promotions, update_promotions, delete_promotions, list_price_lists, create_price_lists, update_price_lists, delete_price_lists.

PROMOTIONS:
- create_promotions: code, type (standard/buyget), is_automatic, application_method (percentage/fixed, value, target_type: order/items/shipping)
- update_promotions: id, code, is_automatic, status (active/inactive)

PRICE LISTS:
- create_price_lists: title, description, type (sale/override), status (active/draft), starts_at, ends_at
- Useful for seasonal sales, VIP pricing, wholesale overrides

Use \`clarify\` for questions. All tools accept arrays.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'Promotions/pricing request' },
          output_schema: { type: 'string', description: 'Response' },
          mcp_servers: ['store-promotions', 'store-pricing'],
        },
        'media-specialist': {
          description: 'Handles images, uploads, and variant image assignments',
          system_prompt: `You manage product images. Tools: upload_product_images, delete_product_images, update_variant_images, update_product_media.

IMAGE WORKFLOW:
1. Call \`list_attachments\` to get attachment IDs from user uploads.
2. \`upload_product_images\` with attachment_id (NEVER URLs). Optionally assign per-image variants.
3. \`update_variant_images\` for bulk assign/unassign. "assign" is ADDITIVE — use "unassign" to remove.
4. Group by color: all Black shots -> Black variants, Grey -> Grey variants.

Use \`clarify\` for questions.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'Media request' },
          output_schema: { type: 'string', description: 'Response' },
          mcp_servers: ['store-catalog', 'store-media'],
        },
        'general-specialist': {
          description: 'Handles general questions and greetings',
          system_prompt: `You are a friendly storefront assistant. Answer general questions about the platform's capabilities. You can explain what store management, catalog, media, orders, promotions, and pricing features are available. Use \`clarify\` if you need more context.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'General question' },
          output_schema: { type: 'string', description: 'Response' },
        },
        responder: {
          description: 'Wraps specialist response with navigation hints',
          system_prompt: `You receive a specialist's response about a storefront operation. Your job is to pass through the response text and add navigation hints linking to relevant pages.

Parse the specialist response for resource IDs (store IDs, product IDs, order IDs, etc.) and include appropriate navigation hints.

${NAV_HINTS_PROMPT}`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: null,
          input_schema: { type: 'string', description: 'Specialist response text' },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
        },
      },
      steps: [
        {
          id: 'route',
          agent: 'router',
          input: '${{ trigger.message }}',
        },
        {
          id: 'handle-store',
          agent: 'store-specialist',
          input: '${{ trigger.message }}',
          if: "${{ steps.route.output == 'store' }}",
          needs: ['route'],
          attachments: true,
        },
        {
          id: 'handle-catalog',
          agent: 'catalog-specialist',
          input: '${{ trigger.message }}',
          if: "${{ steps.route.output == 'catalog' }}",
          needs: ['route'],
        },
        {
          id: 'handle-orders',
          agent: 'order-specialist',
          input: '${{ trigger.message }}',
          if: "${{ steps.route.output == 'orders' }}",
          needs: ['route'],
        },
        {
          id: 'handle-promotions',
          agent: 'promotions-specialist',
          input: '${{ trigger.message }}',
          if: "${{ steps.route.output == 'promotions' }}",
          needs: ['route'],
        },
        {
          id: 'handle-media',
          agent: 'media-specialist',
          input: '${{ trigger.message }}',
          if: "${{ steps.route.output == 'media' }}",
          needs: ['route'],
          attachments: true,
        },
        {
          id: 'handle-general',
          agent: 'general-specialist',
          input: '${{ trigger.message }}',
          if: "${{ steps.route.output == 'general' }}",
          needs: ['route'],
        },
        {
          id: 'respond',
          agent: 'responder',
          input: '${{ steps.handle-store.output }}${{ steps.handle-catalog.output }}${{ steps.handle-orders.output }}${{ steps.handle-promotions.output }}${{ steps.handle-media.output }}${{ steps.handle-general.output }}',
          needs: ['handle-store', 'handle-catalog', 'handle-orders', 'handle-promotions', 'handle-media', 'handle-general'],
        },
      ],
      output: '${{ steps.respond.output }}',
    },
  },
  {
    name: 'Storefront Parallel Audit',
    description:
      'Five auditors analyze store health simultaneously (profile, catalog, media, orders, promotions), then a synthesizer combines their findings.',
    category: 'Basics',
    workflow: {
      name: 'storefront-audit',
      input_schema: { type: 'string', description: 'Store ID or audit request' },
      output_schema: NAV_HINTS_OUTPUT_SCHEMA,
      agents: {
        'store-auditor': {
          description: 'Audits store profile and shipping completeness',
          system_prompt: `You audit store profile and shipping completeness. Call \`list_stores\` with the store ID for details.

CHECK FOR:
- Missing name, description, or tagline
- No contact email or phone
- Incomplete address fields
- Missing social links (instagram, twitter, etc.)
- No shipping/returns/warranty policies
- Not published (is_published = false)
- Not accepting orders
- Call \`list_shipping_options\` — check if any exist

Return a structured report: { score: "X/10", missing: [...], recommendations: [...] }`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Audit request' },
          output_schema: { type: 'string', description: 'Store profile audit' },
          mcp_servers: ['store-core'],
        },
        'catalog-auditor': {
          description: 'Audits product catalog quality',
          system_prompt: `You audit product catalog quality. Call \`list_products\` with fields='full' and \`list_categories\` for the store.

CHECK FOR:
- Products missing descriptions or titles
- Products still in "draft" that should be published
- Products without categories (use \`list_uncategorized_products\`)
- Missing variants or pricing
- Categories with no products
- Flat category structure (no hierarchy)
- Collections coverage (\`list_collections\`)
- Inventory levels (\`list_inventory\`)

Return: { score: "X/10", product_count: N, issues: [...], recommendations: [...] }`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Audit request' },
          output_schema: { type: 'string', description: 'Catalog audit' },
          mcp_servers: ['store-catalog'],
        },
        'media-auditor': {
          description: 'Audits image coverage and variant assignments',
          system_prompt: `You audit product image coverage. Call \`list_products\` with fields='full' to check images.

CHECK FOR:
- Products with no images
- Products with no thumbnail set
- Variants with no images assigned
- Low image count (fewer than 3 per product)
- Published products missing images

Return: { score: "X/10", products_without_images: N, variants_without_images: N, recommendations: [...] }`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Audit request' },
          output_schema: { type: 'string', description: 'Media audit' },
          mcp_servers: ['store-catalog', 'store-media'],
        },
        'orders-auditor': {
          description: 'Audits order fulfillment status',
          system_prompt: `You audit order and fulfillment health. Call \`list_orders\` and \`list_customers\` for the store.

CHECK FOR:
- Orders stuck in "pending" for too long
- Unfulfilled orders
- Canceled order rate
- Customer count and engagement
- Any orders missing fulfillment tracking

Return: { score: "X/10", pending_orders: N, fulfilled: N, customer_count: N, issues: [...], recommendations: [...] }`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Audit request' },
          output_schema: { type: 'string', description: 'Orders audit' },
          mcp_servers: ['store-orders', 'store-customers'],
        },
        'promotions-auditor': {
          description: 'Audits promotions and pricing strategy',
          system_prompt: `You audit promotions and pricing strategy. Call \`list_promotions\` and \`list_price_lists\` for the store.

CHECK FOR:
- No active promotions (missed revenue opportunity)
- Expired promotions still listed
- Price lists with no end dates (forgotten sales)
- Missing seasonal or launch promotions
- Automatic vs code-based discount mix

Return: { score: "X/10", active_promos: N, active_price_lists: N, issues: [...], recommendations: [...] }`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Audit request' },
          output_schema: { type: 'string', description: 'Promotions audit' },
          mcp_servers: ['store-promotions', 'store-pricing'],
        },
        synthesizer: {
          description: 'Combines audit results into a final store health report with navigation hints',
          system_prompt: `You synthesize five audit reports (store profile, catalog, media, orders, promotions) into a single store health report.

FORMAT:
1. Overall Score (average of five)
2. Executive Summary (2-3 sentences)
3. Critical Issues (must fix before scaling)
4. Recommendations (priority ordered)
5. Quick Wins (easy improvements)

Be actionable and specific. Reference exact missing fields or products.

${NAV_HINTS_PROMPT}`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Combined audit data' },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
        },
      },
      steps: [
        {
          id: 'audit-store',
          agent: 'store-auditor',
          input: '${{ trigger.message }}',
        },
        {
          id: 'audit-catalog',
          agent: 'catalog-auditor',
          input: '${{ trigger.message }}',
        },
        {
          id: 'audit-media',
          agent: 'media-auditor',
          input: '${{ trigger.message }}',
        },
        {
          id: 'audit-orders',
          agent: 'orders-auditor',
          input: '${{ trigger.message }}',
        },
        {
          id: 'audit-promotions',
          agent: 'promotions-auditor',
          input: '${{ trigger.message }}',
        },
        {
          id: 'synthesize',
          agent: 'synthesizer',
          input: 'Store Audit:\n${{ steps.audit-store.output }}\n\nCatalog Audit:\n${{ steps.audit-catalog.output }}\n\nMedia Audit:\n${{ steps.audit-media.output }}\n\nOrders Audit:\n${{ steps.audit-orders.output }}\n\nPromotions Audit:\n${{ steps.audit-promotions.output }}',
          needs: ['audit-store', 'audit-catalog', 'audit-media', 'audit-orders', 'audit-promotions'],
        },
      ],
      output: '${{ steps.synthesize.output }}',
    },
  },
  {
    name: 'Catalog Builder',
    description:
      'Fan-out strategy: create multiple products concurrently from a list of specs after a pre-flight category check.',
    category: 'Strategies',
    workflow: {
      name: 'catalog-builder',
      input_schema: { type: 'string', description: 'Product creation instructions' },
      output_schema: { type: 'string', description: 'Creation results' },
      agents: {
        preflight: {
          description: 'Pre-flight check: list existing categories and products',
          system_prompt: `Before creating products, gather context. Call \`list_categories\` and \`list_products\` for the store.

Return a summary: existing categories (with IDs), existing product titles, and any category templates available (call \`list_category_templates\`). This data helps the builder avoid duplicates.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Store context request' },
          output_schema: { type: 'string', description: 'Pre-flight context' },
          mcp_servers: ['store-catalog'],
        },
        builder: {
          description: 'Creates a product with full details',
          system_prompt: `You create products using \`create_products\`. Each run you handle ONE product from the given spec.

RULES:
- Prices in CENTS: $99.99 = 9999
- Status: "draft" unless told otherwise
- Title: brand-quality (e.g., "Premium Heavyweight Hoodie")
- Description: 2-3 sentences of compelling marketing copy
- Options: define ALL values upfront (Size, Color, etc.)
- Variants: every option combination. Title: "Value1 / Value2"
- category_ids: use leaf categories from the pre-flight data. Create categories first if needed.

After creating, call \`list_products\` with the product id and fields='full' to verify. Include the store_id, product_id, and variant_ids in your response so the user can navigate to the created product.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Product spec with context' },
          output_schema: { type: 'string', description: 'Created product details' },
          mcp_servers: ['store-catalog'],
        },
      },
      steps: [
        {
          id: 'preflight',
          agent: 'preflight',
          input: '${{ trigger.message }}',
        },
        {
          id: 'build',
          agent: 'builder',
          input: 'Pre-flight data:\n${{ steps.preflight.output }}\n\nUser request:\n${{ trigger.message }}',
          needs: ['preflight'],
          strategy: {
            type: 'parallel',
            items: ['Product 1', 'Product 2', 'Product 3'],
          },
        },
      ],
      output: '${{ steps.build.output }}',
    },
  },
  {
    name: 'Dynamic Catalog Analyzer',
    description:
      'Dynamic fan-out: lists all products then fans out to analyze each one individually. Uses structured output and output retries.',
    category: 'Strategies',
    workflow: {
      name: 'dynamic-catalog-analyzer',
      input_schema: { type: 'string', description: 'Analysis request' },
      output_schema: { type: 'string', description: 'Product analysis results' },
      agents: {
        lister: {
          description: 'Lists all products and returns their IDs',
          system_prompt: `List all products for the store using \`list_products\` with fields='basics'. Return a JSON object with a product_ids array containing all product IDs found.

Example output: { "product_ids": ["prod_1", "prod_2", "prod_3"] }`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Store to analyze' },
          output_schema: {
            type: 'object',
            description: 'Product IDs found',
            properties: {
              product_ids: { type: 'array', description: 'Array of product ID strings' },
            },
            required: ['product_ids'],
          },
          output_retries: 2,
          mcp_servers: ['store-catalog'],
        },
        analyzer: {
          description: 'Analyzes a single product for quality, completeness, and pricing',
          system_prompt: `Analyze the given product using \`list_products\` with the product id and fields='full'. Also check pricing with \`list_price_lists\`. Check:

1. Title quality (descriptive, brand-appropriate)
2. Description (exists, compelling, adequate length)
3. Status (draft vs published)
4. Categories assigned (has any? leaf categories?)
5. Variants (complete option combinations? pricing set?)
6. Images (any images? thumbnail set?)
7. Pricing (has sale/override price lists?)

Return a brief quality report with a score out of 10 and specific improvement suggestions.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Product to analyze' },
          output_schema: { type: 'string', description: 'Product quality report' },
          mcp_servers: ['store-catalog', 'store-pricing'],
        },
      },
      steps: [
        {
          id: 'list',
          agent: 'lister',
          input: '${{ trigger.message }}',
        },
        {
          id: 'analyze-each',
          agent: 'analyzer',
          input: 'Analyze product from the store in the original request: ${{ trigger.message }}',
          strategy: {
            type: 'parallel',
            items: '${{ steps.list.output.product_ids }}',
          },
          needs: ['list'],
        },
      ],
      output: '${{ steps.analyze-each.output }}',
    },
  },
  {
    name: 'Store Setup Wizard',
    description:
      'Sequential for-each: guides complete store setup through ordered phases — profile, categories, products, shipping, and promotions.',
    category: 'Strategies',
    workflow: {
      name: 'store-setup-wizard',
      input_schema: { type: 'string', description: 'Store setup instructions' },
      output_schema: { type: 'string', description: 'Setup completion report' },
      agents: {
        'setup-agent': {
          description: 'Handles one phase of store setup, building on previous results',
          system_prompt: `You handle ONE phase of store setup at a time. The phase name is provided in your input along with any previous context.

PHASES:
- "Store Profile": Use \`create_stores\` or \`update_stores\` to set up name, description, tagline, contact info, and social links. Return the store_id.
- "Category Hierarchy": Use \`list_category_templates\` to see available templates. Either \`apply_category_template\` or manually \`create_categories\` building top-down. Return category IDs.
- "First Product": Use \`create_products\` with full options, variants, and pricing (in CENTS). Assign to categories from previous phase. Return product_id and variant_ids.
- "Shipping & Pricing": Use \`create_shipping_options\` for delivery methods (flat_rate or calculated). Use \`create_price_lists\` for any launch sales. Return shipping option and price list IDs.
- "Launch Promotions": Use \`create_promotions\` for launch discount codes (e.g., LAUNCH10 for 10% off). Return promotion IDs and codes.

ALWAYS use IDs from previous phases. Use \`clarify\` for any decisions. Prices in CENTS.

Include store_id, product_id, and other resource IDs in your response so the user can navigate to the created resources.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Phase name with context' },
          output_schema: { type: 'string', description: 'Phase result with IDs' },
          mcp_servers: ['store-core', 'store-catalog', 'store-media', 'store-promotions', 'store-pricing'],
        },
      },
      steps: [
        {
          id: 'setup',
          agent: 'setup-agent',
          input: 'User request: ${{ trigger.message }}',
          strategy: {
            type: 'for_each',
            items: ['Store Profile', 'Category Hierarchy', 'First Product', 'Shipping & Pricing', 'Launch Promotions'],
          },
          attachments: true,
        },
      ],
      output: '${{ steps.setup.output }}',
    },
  },
  {
    name: 'Product Matrix Analyzer',
    description:
      'Matrix strategy: analyzes products across status (draft/published) and pricing (standard/sale) dimensions for quality control.',
    category: 'Strategies',
    workflow: {
      name: 'product-matrix-analyzer',
      input_schema: { type: 'string', description: 'Store to analyze' },
      output_schema: { type: 'string', description: 'Matrix analysis results' },
      agents: {
        'matrix-checker': {
          description: 'Checks products matching a specific status + pricing combination',
          system_prompt: `You analyze products for a specific combination of status and pricing strategy.

You receive matrix parameters: "status" (draft or published) and "has_pricing" (standard or sale).

1. Use \`list_products\` with the status filter and fields='full'.
2. Use \`list_price_lists\` to check for sale/override pricing.
3. Cross-reference which products have sale pricing vs standard only.
4. Report: count, product titles, and specific issues.

KEY FINDINGS TO REPORT:
- "published + standard": live products at regular price — check if a sale would boost sales
- "published + sale": active sale items — verify sale dates and discount amounts
- "draft + standard": unpublished, no sale planned — ready to publish?
- "draft + sale": has sale pricing but not live — may be awaiting launch`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Matrix parameters' },
          output_schema: { type: 'string', description: 'Segment analysis' },
          mcp_servers: ['store-catalog', 'store-pricing'],
        },
      },
      steps: [
        {
          id: 'analyze',
          agent: 'matrix-checker',
          input: 'Store context: ${{ trigger.message }}',
          strategy: {
            type: 'matrix',
            matrix: {
              status: ['draft', 'published'],
              has_pricing: ['standard', 'sale'],
            },
          },
        },
      ],
      output: '${{ steps.analyze.output }}',
    },
  },
  {
    name: 'Storefront Manager',
    description:
      'Multi-agent delegation: a coordinator orchestrates catalog, image, order, and promotions specialists for complex operations.',
    category: 'Advanced',
    workflow: {
      name: 'storefront-manager',
      agents: {
        coordinator: {
          description: 'User-facing orchestrator that plans, clarifies, delegates to specialists, and reports results',
          system_prompt: `You are a senior e-commerce orchestrator managing a vendor's storefront through specialist agents. You NEVER create or modify products, variants, images, orders, or promotions directly — you delegate and validate.

YOUR TOOLS (store-core):
- \`list_stores\`: Get store context. ALWAYS call first.
- \`create_stores\` / \`update_stores\` / \`delete_stores\`: Manage store profiles directly.
- \`list_shipping_options\` / \`create_shipping_options\` / \`update_shipping_options\` / \`delete_shipping_options\`: Manage shipping.

CHAIN OF THOUGHT (MANDATORY):
- Think step-by-step. Share your plan: "Here's my plan: 1) ... 2) ... 3) ..."
- After each delegation, explain what happened and what's next.

PROACTIVE CLARIFICATION (CRITICAL):
- Use the \`clarify\` tool for ALL questions. NEVER type questions as plain text.
- Provide 3-4 expert suggestions as options.

DELEGATION:
- \`call_catalog_expert\`: ALL product/variant/category/collection/inventory operations.
- \`call_image_curator\`: ALL image operations.
- \`call_order_manager\`: ALL order fulfillment and customer queries.
- \`call_promotions_manager\`: ALL promotions and price list operations.
- ALWAYS pass store_id, product_id, and variant_ids to specialists.

${NAV_HINTS_PROMPT}`,
          history_group: 'chat',
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: "User's message" },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
          mcp_servers: ['store-core'],
          can_call_agents: ['catalog-expert', 'image-curator', 'order-manager', 'promotions-manager'],
        },
        'catalog-expert': {
          description: 'Product structure specialist with pre-flight checks and post-action verification',
          system_prompt: `You are a catalog management specialist. You handle ALL product, variant, category, collection, and inventory operations.

TOOLS: list_products, create_products, update_products, delete_products, list_variants, create_variants, update_variants, delete_variants, list_categories, create_categories, update_categories, delete_categories, list_category_templates, apply_category_template, bulk_categorize_products, list_uncategorized_products, update_product_options, list_collections, create_collections, update_collections, delete_collections, update_collection_products, list_inventory, update_inventory.

PRE-FLIGHT: ALWAYS list before creating. Never create duplicates.
POST-VERIFY: After mutations, call list_products with id filter and fields='full' to confirm.
BATCH: All tools accept arrays. Prices in CENTS ($99.99 = 9999). Default status "draft". Use leaf categories.

RETURN FORMAT:
{ product_id: "prod_xxx", variants: { "Black": ["var_1", "var_2"], "Grey": ["var_3", "var_4"] }, categories_used: ["cat_hoodies"] }`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: null,
          input_schema: { type: 'string', description: 'Detailed instructions from coordinator' },
          output_schema: { type: 'string', description: 'Structured result with IDs' },
          mcp_servers: ['store-catalog'],
        },
        'image-curator': {
          description: 'Visual asset specialist for image uploads and variant assignments',
          system_prompt: `You are an image curation specialist. You handle ALL image operations.

TOOLS: upload_product_images, delete_product_images, update_variant_images, update_product_media.

UPLOAD (attachment IDs only, NEVER URLs):
- \`upload_product_images\` with per-image variant mappings:
  { "images": [{ "attachment_id": "uuid-1", "variant_ids": ["var_black_s", "var_black_m"] }] }

ASSIGN / UNASSIGN:
- \`update_variant_images\`: { "assign": [...], "unassign": [...] }
- "assign" is ADDITIVE. Use "unassign" to remove explicitly.
- Group by color: Black shots -> Black variants.

ACCURACY > SPEED. Never proceed with incorrect mappings.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: null,
          input_schema: { type: 'string', description: 'Instructions with store_id, product_id, variant IDs, attachment mappings' },
          output_schema: { type: 'string', description: 'Result with verification status' },
          mcp_servers: ['store-catalog', 'store-media'],
        },
        'order-manager': {
          description: 'Order fulfillment and customer management specialist',
          system_prompt: `You manage orders and customers.

TOOLS: list_orders, create_fulfillment, cancel_order, list_customers.

ORDER WORKFLOWS:
- List orders: use status filter (pending, completed, canceled)
- Fulfill: create_fulfillment with order_id, optional items, tracking_number, tracking_url
- Cancel: cancel_order (irreversible — confirm first)
- Customer lookup: list_customers with search

Be careful with fulfillments and cancellations — these are irreversible. Always verify before acting.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: null,
          input_schema: { type: 'string', description: 'Order/customer instructions' },
          output_schema: { type: 'string', description: 'Order operation result' },
          mcp_servers: ['store-orders', 'store-customers'],
        },
        'promotions-manager': {
          description: 'Promotions and pricing specialist',
          system_prompt: `You manage promotions and price lists.

TOOLS: list_promotions, create_promotions, update_promotions, delete_promotions, list_price_lists, create_price_lists, update_price_lists, delete_price_lists.

PROMOTIONS: code, type (standard/buyget), is_automatic, application_method (percentage/fixed, value, target_type)
PRICE LISTS: title, type (sale/override), status (active/draft), starts_at, ends_at

All tools accept arrays for batch operations.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: null,
          input_schema: { type: 'string', description: 'Promotions/pricing instructions' },
          output_schema: { type: 'string', description: 'Promotions operation result' },
          mcp_servers: ['store-promotions', 'store-pricing'],
        },
      },
      steps: [
        {
          id: 'respond',
          agent: 'coordinator',
          input: '${{ trigger.message }}',
          attachments: true,
        },
      ],
      output: '${{ steps.respond.output }}',
    },
  },
  {
    name: 'Storefront Pipeline',
    description:
      'Shared context pattern: planner, builder, curator, and pricing manager pass data through shared mutable context with isolated history groups.',
    category: 'Advanced',
    workflow: {
      name: 'storefront-pipeline',
      input_schema: { type: 'string', description: 'Catalog building instructions' },
      output_schema: {
        type: 'object',
        description: 'Pipeline result with context data and navigation hints',
        properties: {
          type: { type: 'string', description: "Always 'nav_hints'" },
          response: { type: 'string', description: 'Summary' },
          hints: { type: 'array', description: 'Navigation hints' },
          created: { type: 'object', description: 'Created resource IDs' },
        },
        required: ['type', 'response'],
      },
      agents: {
        planner: {
          description: 'Analyzes the request and writes a build plan to shared context',
          system_prompt: `You plan catalog builds. Analyze the user's request and the current store state.

1. Call \`list_stores\` to get the store_id.
2. Call \`list_categories\` and \`list_products\` to understand what exists.
3. Write to context using \`write_context\`:
   - store_id: the target store ID
   - product_specs: array of product specifications to create
   - category_plan: categories needed

Return a summary of the plan.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'User instructions' },
          output_schema: { type: 'string', description: 'Plan summary' },
          mcp_servers: ['store-core', 'store-catalog'],
          context_writes: {
            store_id: { type: 'string', description: 'Target store ID' },
            product_specs: { type: 'array', description: 'Product specs to create' },
            category_plan: { type: 'object', description: 'Category creation plan' },
          },
        },
        builder: {
          description: 'Reads the plan from context and creates products',
          system_prompt: `You execute catalog builds. Read the plan from context using \`read_context\`.

1. Read store_id, product_specs, and category_plan from context.
2. Create any needed categories using \`create_categories\`.
3. Create products using \`create_products\` with proper options, variants, pricing (CENTS!).
4. Verify with \`list_products\` using id filter and fields='full'.
5. Write product_ids and variant_map to context.

Prices in CENTS. Status "draft". Use leaf categories.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'build',
          input_schema: { type: 'string', description: 'Build instruction' },
          output_schema: { type: 'string', description: 'Build result with IDs' },
          mcp_servers: ['store-catalog'],
          context_reads: ['store_id', 'product_specs', 'category_plan'],
          context_writes: {
            product_ids: { type: 'array', description: 'Created product IDs' },
            variant_map: { type: 'object', description: 'Variant IDs grouped by product and option' },
          },
        },
        curator: {
          description: 'Reads product IDs from context and handles images',
          system_prompt: `You handle images for newly created products. Read context for store_id and product_ids.

1. Read store_id, product_ids, variant_map from context.
2. Call \`list_attachments\` to check for user-uploaded images.
3. If attachments exist, upload with \`upload_product_images\` using attachment_ids.
4. Assign to variants based on the variant_map context.

If no attachments, report which products need images.`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: null,
          input_schema: { type: 'string', description: 'Curation instruction' },
          output_schema: { type: 'string', description: 'Curation result' },
          mcp_servers: ['store-catalog', 'store-media'],
          context_reads: ['store_id', 'product_ids', 'variant_map'],
        },
        'pricing-manager': {
          description: 'Sets up promotions and price lists for newly created products',
          system_prompt: `You set up pricing and promotions for newly created products. Read context for store_id and product_ids.

1. Read store_id and product_ids from context.
2. Create a launch price list using \`create_price_lists\` if the user wants a sale.
3. Create promotional codes using \`create_promotions\` (e.g., LAUNCH10 for 10% off).
4. Write created IDs to context.

All tools accept arrays. Set appropriate start/end dates for time-limited sales.

${NAV_HINTS_PROMPT}`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: null,
          input_schema: { type: 'string', description: 'Pricing instruction' },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
          mcp_servers: ['store-promotions', 'store-pricing'],
          context_reads: ['store_id', 'product_ids', 'app_routes'],
          context_writes: {
            promotion_ids: { type: 'array', description: 'Created promotion IDs' },
            price_list_ids: { type: 'array', description: 'Created price list IDs' },
          },
        },
      },
      steps: [
        {
          id: 'plan',
          agent: 'planner',
          input: '${{ trigger.message }}',
          attachments: true,
        },
        {
          id: 'build',
          agent: 'builder',
          input: 'Execute the build plan from context',
          needs: ['plan'],
        },
        {
          id: 'curate',
          agent: 'curator',
          input: 'Handle images for the created products',
          needs: ['build'],
          attachments: true,
        },
        {
          id: 'pricing',
          agent: 'pricing-manager',
          input: 'Set up launch pricing and promotions for the created products',
          needs: ['build'],
        },
      ],
      output: {
        type: 'nav_hints',
        response: '${{ steps.pricing.output.response }}',
        hints: '${{ steps.pricing.output.hints }}',
        created: {
          products: '${{ context.product_ids }}',
          variants: '${{ context.variant_map }}',
          promotions: '${{ context.promotion_ids }}',
          price_lists: '${{ context.price_list_ids }}',
          store: '${{ context.store_id }}',
        },
      },
    },
  },
  {
    name: 'Storefront Chaining',
    description:
      'Sub-workflow pattern: a coordinator routes to reusable catalog-setup, media-setup, and operations-setup sub-workflows.',
    category: 'Advanced',
    workflow: {
      name: 'storefront-chaining',
      input_schema: { type: 'string', description: 'User request' },
      output_schema: NAV_HINTS_OUTPUT_SCHEMA,
      variables: {
        default_currency: 'usd',
        default_status: 'draft',
        store_tone: 'professional and brand-forward',
      },
      agents: {
        coordinator: {
          description: 'Routes to the appropriate sub-workflow',
          system_prompt: `You coordinate storefront operations by routing to sub-workflows.

Store tone: \${{ variables.store_tone }}
Default currency: \${{ variables.default_currency }}
Default status: \${{ variables.default_status }}

1. Call \`list_stores\` to get context.
2. Classify the request: catalog setup, media setup, or operations (orders/promotions).
3. Use the appropriate sub-workflow: \`call_catalog_setup\`, \`call_media_setup\`, or \`call_operations_setup\`.
4. Pass the store_id and detailed instructions.
5. Report results to the user.

Use \`clarify\` for all questions.

${NAV_HINTS_PROMPT}`,
          model: 'anthropic/claude-sonnet-4.5',
          history_group: 'chat',
          input_schema: { type: 'string', description: 'User request' },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
          mcp_servers: ['store-core'],
          can_call_workflows: ['catalog-setup', 'media-setup', 'operations-setup'],
        },
        'catalog-agent': {
          description: 'Handles catalog operations within sub-workflows',
          system_prompt: `You handle catalog operations. Default currency: \${{ variables.default_currency }}. Default status: \${{ variables.default_status }}.

Prices in CENTS. List before creating. Verify after mutations. Use batch operations. Use leaf categories.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Catalog instructions' },
          output_schema: { type: 'string', description: 'Result' },
          mcp_servers: ['store-catalog'],
        },
        'media-agent': {
          description: 'Handles media operations within sub-workflows',
          system_prompt: `You handle image operations. Use attachment IDs only (never URLs). Verify assignments after changes. Group images by color for variant assignment.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Media instructions' },
          output_schema: { type: 'string', description: 'Result' },
          mcp_servers: ['store-catalog', 'store-media'],
        },
        'operations-agent': {
          description: 'Handles orders, promotions, and pricing within sub-workflows',
          system_prompt: `You handle order fulfillment, promotions, and pricing operations.

ORDER TOOLS: list_orders, create_fulfillment, cancel_order, list_customers
PROMOTION TOOLS: list_promotions, create_promotions, update_promotions, delete_promotions
PRICING TOOLS: list_price_lists, create_price_lists, update_price_lists, delete_price_lists

Be careful with fulfillments and cancellations — these are irreversible. All tools accept arrays.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Operations instructions' },
          output_schema: { type: 'string', description: 'Result' },
          mcp_servers: ['store-orders', 'store-customers', 'store-promotions', 'store-pricing'],
        },
      },
      sub_workflows: {
        'catalog-setup': {
          description: 'Sets up categories and products for a store',
          input_schema: {
            type: 'object',
            properties: {
              store_id: { type: 'string', description: 'Store ID' },
              instructions: { type: 'string', description: 'What to create' },
            },
            required: ['store_id', 'instructions'],
          },
          output_schema: { type: 'string', description: 'Catalog setup result' },
          steps: [
            {
              id: 'setup-catalog',
              agent: 'catalog-agent',
              input: 'Store: ${{ trigger.store_id }}\nInstructions: ${{ trigger.instructions }}',
            },
          ],
          output: '${{ steps.setup-catalog.output }}',
        },
        'media-setup': {
          description: 'Handles image uploads and assignments for a store',
          input_schema: {
            type: 'object',
            properties: {
              store_id: { type: 'string', description: 'Store ID' },
              product_id: { type: 'string', description: 'Product ID' },
              instructions: { type: 'string', description: 'Image instructions' },
            },
            required: ['store_id', 'instructions'],
          },
          output_schema: { type: 'string', description: 'Media setup result' },
          steps: [
            {
              id: 'setup-media',
              agent: 'media-agent',
              input: 'Store: ${{ trigger.store_id }}\nProduct: ${{ trigger.product_id }}\nInstructions: ${{ trigger.instructions }}',
              attachments: true,
            },
          ],
          output: '${{ steps.setup-media.output }}',
        },
        'operations-setup': {
          description: 'Handles order fulfillment, promotions, and pricing setup',
          input_schema: {
            type: 'object',
            properties: {
              store_id: { type: 'string', description: 'Store ID' },
              instructions: { type: 'string', description: 'Operations instructions' },
            },
            required: ['store_id', 'instructions'],
          },
          output_schema: { type: 'string', description: 'Operations setup result' },
          steps: [
            {
              id: 'setup-operations',
              agent: 'operations-agent',
              input: 'Store: ${{ trigger.store_id }}\nInstructions: ${{ trigger.instructions }}',
            },
          ],
          output: '${{ steps.setup-operations.output }}',
        },
      },
      steps: [
        {
          id: 'coordinate',
          agent: 'coordinator',
          input: '${{ trigger.message }}',
          attachments: true,
        },
      ],
      output: '${{ steps.coordinate.output }}',
    },
  },
  {
    name: 'Resilient Storefront',
    description:
      'Error handling pattern: retry with exponential backoff, continue on error for partial failures, and step/workflow-level fallback handlers.',
    category: 'Error Handling',
    workflow: {
      name: 'resilient-storefront',
      input_schema: { type: 'string', description: 'Batch operation request' },
      output_schema: NAV_HINTS_OUTPUT_SCHEMA,
      agents: {
        'batch-operator': {
          description: 'Performs batch catalog operations with retry support',
          system_prompt: `You perform batch catalog operations. Use \`create_products\`, \`update_products\`, or \`delete_products\` depending on the request.

Also supports: \`create_categories\`, \`update_categories\`, \`delete_categories\`, \`create_collections\`, \`update_collections\`, \`delete_collections\`, \`update_inventory\`, \`bulk_categorize_products\`.

All tools accept arrays for batch operations. Prices in CENTS. Default status "draft".

If an operation fails, provide detailed error info so the fallback handler can help.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Batch operation request' },
          output_schema: { type: 'string', description: 'Operation result' },
          mcp_servers: ['store-catalog'],
        },
        fallback: {
          description: 'Handles failures gracefully and provides recovery options',
          system_prompt: `A batch operation failed after retries. Analyze the error and provide:

1. What likely went wrong (invalid IDs, missing required fields, permission issues)
2. Which items may have succeeded vs failed (partial success is possible)
3. Recovery steps the user can take
4. Whether it's safe to retry or if data needs correction first

Be helpful and specific. Check current state with \`list_products\` if needed.`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Error context' },
          output_schema: { type: 'string', description: 'Recovery guidance' },
          mcp_servers: ['store-catalog'],
        },
        reporter: {
          description: 'Formats the final operation report with navigation hints',
          system_prompt: `Summarize the batch operation results. Include:
- Total items processed
- Successes and failures
- Any recovery actions taken
- Next steps for the user

${NAV_HINTS_PROMPT}`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Operation data' },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
        },
      },
      steps: [
        {
          id: 'batch-op',
          agent: 'batch-operator',
          input: '${{ trigger.message }}',
          timeout: 60,
          continue_on_error: true,
          retry: {
            max_attempts: 3,
            backoff: 'exponential',
            delay_seconds: 2.0,
          },
          on_failure: {
            agent: 'fallback',
            message: 'The batch operation failed after retries. Analyzing what went wrong...',
          },
        },
        {
          id: 'report',
          agent: 'reporter',
          input: 'Operation result:\n${{ steps.batch-op.output }}\nStatus: ${{ steps.batch-op.status }}',
          needs: ['batch-op'],
        },
      ],
      output: '${{ steps.report.output }}',
      on_failure: {
        message: 'The storefront operation encountered an unexpected error. Your data is safe — no partial changes were committed. Please try again or contact support.',
      },
    },
  },
  {
    name: 'Storefront Validator',
    description:
      'Fail-fast pattern: validates data before mutations and aborts if validation fails. Prevents partial state from dangerous operations.',
    category: 'Error Handling',
    workflow: {
      name: 'storefront-validator',
      input_schema: { type: 'string', description: 'Mutation request to validate and execute' },
      output_schema: NAV_HINTS_OUTPUT_SCHEMA,
      fail_fast: true,
      agents: {
        validator: {
          description: 'Validates mutation requests before execution',
          system_prompt: `You validate storefront mutation requests BEFORE they execute. Check the current state using \`list_products\`, \`list_categories\`, \`list_stores\`, \`list_promotions\`, etc.

VALIDATION CHECKS:
- Product creation: required fields present? Options have values? Prices are in cents (not dollars)?
- Category creation: parent exists? No duplicate names?
- Store update: valid email format? URLs are well-formed? Currency code is valid ISO?
- Promotions: code is unique? application_method is valid?
- Deletions: IDs exist? Not deleting last remaining item?

Return a JSON object:
{ "valid": true/false, "errors": ["error 1", "error 2"], "warnings": ["warning 1"], "sanitized_input": { ... } }

If valid, include sanitized_input with corrected data (e.g., prices converted to cents if given as dollars).`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Request to validate' },
          output_schema: {
            type: 'object',
            description: 'Validation result',
            properties: {
              valid: { type: 'boolean', description: 'Whether the request is valid' },
              errors: { type: 'array', description: 'Validation errors' },
              warnings: { type: 'array', description: 'Non-blocking warnings' },
            },
            required: ['valid'],
          },
          mcp_servers: ['store-core', 'store-catalog', 'store-promotions'],
        },
        executor: {
          description: 'Executes validated mutations with navigation hints',
          system_prompt: `You execute pre-validated storefront mutations. The validator has already confirmed the data is correct.

Execute using the appropriate tool:
- Products: \`create_products\` / \`update_products\` / \`delete_products\`
- Categories: \`create_categories\` / \`update_categories\` / \`delete_categories\`
- Stores: \`update_stores\` / \`delete_stores\`
- Promotions: \`create_promotions\` / \`update_promotions\` / \`delete_promotions\`
- Price lists: \`create_price_lists\` / \`update_price_lists\` / \`delete_price_lists\`

After execution, verify with a list call using the id filter and report the result.

${NAV_HINTS_PROMPT}`,
          model: 'anthropic/claude-sonnet-4.5',
          input_schema: { type: 'string', description: 'Validated request' },
          output_schema: NAV_HINTS_OUTPUT_SCHEMA,
          mcp_servers: ['store-core', 'store-catalog', 'store-promotions', 'store-pricing'],
        },
      },
      steps: [
        {
          id: 'validate',
          agent: 'validator',
          input: '${{ trigger.message }}',
        },
        {
          id: 'execute',
          agent: 'executor',
          input: 'Validated request:\n${{ steps.validate.output }}\n\nOriginal request:\n${{ trigger.message }}',
          if: '${{ steps.validate.output.valid }}',
          needs: ['validate'],
        },
      ],
      output: '${{ steps.execute.output }}',
    },
  },
];
