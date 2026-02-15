import { Injectable, Logger } from '@nestjs/common';

export interface LlmContext {
  vendorId: string;
  store?: {
    id: string;
    name?: string;
  };
  currentPage?: {
    path: string;
    params?: Record<string, string>;
  };
  app_routes?: typeof APP_ROUTES;
  [key: string]: unknown;
}

const APP_ROUTES = [
  {
    key: 'root',
    path: '/',
    label: 'Dashboard',
    description: 'Home dashboard with store list',
    entity: 'app',
    params: {},
  },
  {
    key: 'stores.detail',
    path: '/stores/:id',
    label: 'Store Overview',
    description:
      'Dashboard with store stats, quick links to products, categories, settings',
    entity: 'store',
    params: {
      id: { description: 'The Medusa store ID (e.g. store_01J...)' },
    },
  },
  {
    key: 'stores.settings',
    path: '/stores/:id/settings',
    label: 'Store Settings',
    description:
      'Store configuration: profile, contact, social links, policies, status, danger zone',
    entity: 'store',
    params: { id: { description: 'The Medusa store ID' } },
    searchParams: {
      section: {
        values: [
          'profile',
          'contact',
          'social',
          'policies',
          'status',
          'danger',
        ],
        description: 'Which settings section to scroll to',
      },
    },
  },
  {
    key: 'stores.products.list',
    path: '/stores/:id/products',
    label: 'Products',
    description: 'List of all products in the store',
    entity: 'product',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'stores.products.new',
    path: '/stores/:id/products/new',
    label: 'New Product',
    description:
      'Product creation wizard with steps: basics, options, pricing, images, info, review',
    entity: 'product',
    params: { id: { description: 'The Medusa store ID' } },
    searchParams: {
      step: {
        values: ['basics', 'options', 'pricing', 'images', 'info', 'review'],
        description: 'Which wizard step to show',
      },
    },
  },
  {
    key: 'stores.products.detail',
    path: '/stores/:id/products/:productId',
    label: 'Product Detail',
    description:
      'Full product page with tabs: basics, images, pricing, options, info, preview',
    entity: 'product',
    params: {
      id: { description: 'The Medusa store ID' },
      productId: {
        description: 'The Medusa product ID (e.g. prod_01J...)',
      },
    },
    searchParams: {
      tab: {
        values: [
          'basics',
          'images',
          'variants',
          'options',
          'info',
          'preview',
        ],
        description: 'Which section of the product to view',
      },
    },
  },
  {
    key: 'stores.categories.list',
    path: '/stores/:id/categories',
    label: 'Categories',
    description: 'Category tree with hierarchy management',
    entity: 'category',
    params: { id: { description: 'The Medusa store ID' } },
    searchParams: {
      edit: {
        description: 'Category ID to open in the edit modal on load',
      },
    },
  },
  {
    key: 'stores.orders.list',
    path: '/stores/:id/orders',
    label: 'Orders',
    description: 'Order management and fulfillment',
    entity: 'order',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'stores.orders.detail',
    path: '/stores/:id/orders/:orderId',
    label: 'Order Detail',
    description: 'Order details with items and fulfillment',
    entity: 'order',
    params: {
      id: { description: 'The Medusa store ID' },
      orderId: { description: 'The order ID' },
    },
  },
  {
    key: 'stores.inventory.list',
    path: '/stores/:id/inventory',
    label: 'Inventory',
    description: 'Stock level management',
    entity: 'inventory',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'stores.customers.list',
    path: '/stores/:id/customers',
    label: 'Customers',
    description: 'Customer management',
    entity: 'customer',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'stores.customers.detail',
    path: '/stores/:id/customers/:customerId',
    label: 'Customer Detail',
    description: 'Customer details with order history',
    entity: 'customer',
    params: {
      id: { description: 'The Medusa store ID' },
      customerId: { description: 'The customer ID' },
    },
  },
  {
    key: 'stores.promotions.list',
    path: '/stores/:id/promotions',
    label: 'Promotions',
    description: 'Discounts and promotion management',
    entity: 'promotion',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'stores.collections.list',
    path: '/stores/:id/collections',
    label: 'Collections',
    description: 'Product collection management',
    entity: 'collection',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'stores.shipping.list',
    path: '/stores/:id/shipping',
    label: 'Shipping',
    description: 'Shipping option management',
    entity: 'shipping_option',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'stores.priceLists.list',
    path: '/stores/:id/price-lists',
    label: 'Price Lists',
    description: 'Custom pricing management',
    entity: 'price_list',
    params: { id: { description: 'The Medusa store ID' } },
  },
  {
    key: 'workflows.playground',
    path: '/workflows/playground',
    label: 'Workflow Playground',
    description: 'Visual workflow builder and executor',
    entity: 'workflow',
    params: {},
    searchParams: {
      workflow: { description: 'ID of a saved workflow to load' },
    },
  },
] as const;

@Injectable()
export class LlmContextService {
  private readonly logger = new Logger(LlmContextService.name);

  async buildContext(
    vendorId: string,
    clientContext?: Record<string, unknown>,
  ): Promise<LlmContext> {
    const context: LlmContext = {
      vendorId,
      app_routes: APP_ROUTES,
    };

    if (clientContext?.storeId) {
      context.store = {
        id: clientContext.storeId as string,
        name: clientContext.storeName as string | undefined,
      };
    }

    if (clientContext?.currentPage) {
      context.currentPage =
        clientContext.currentPage as LlmContext['currentPage'];
    }

    return {
      ...context,
      ...clientContext,
    };
  }
}
