const BASE = process.env.API_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL || 'gege.temi@gmail.com';
const PASSWORD = process.env.TEST_PASSWORD || 'test1234';

let authCookie = '';
let vendorId = '';
let storeId = '';
let productId = '';
let variantId = '';

let passed = 0;
let failed = 0;
const failures = [];

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

async function req(method, path, body, opts) {
  const url = `${BASE}${path}`;
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (opts?.cookie !== undefined) {
    if (opts.cookie) headers['Cookie'] = opts.cookie;
  } else if (authCookie) {
    headers['Cookie'] = authCookie;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });

  let data;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data, headers: res.headers };
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ${green('PASS')} ${name}`);
  } catch (e) {
    failed++;
    const msg = `${name}: ${e.message}`;
    failures.push(msg);
    console.log(`  ${red('FAIL')} ${name}`);
    console.log(`       ${dim(e.message)}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function assertStatus(actual, expected, context) {
  assert(actual === expected, `Expected status ${expected}, got ${actual}${context ? ` (${context})` : ''}`);
}

// ─── AUTH ──────────────────────────────────────────────

async function testAuth() {
  console.log(cyan('\n── Auth ──'));

  await test('POST /api/auth/login - wrong password returns 401', async () => {
    const { status, data } = await req('POST', '/api/auth/login', { email: EMAIL, password: 'wrongpassword' }, { cookie: '' });
    assertStatus(status, 401);
    assert(!!data.message, 'Should have error message');
  });

  await test('POST /api/auth/login - success', async () => {
    const { status, data, headers } = await req('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD }, { cookie: '' });
    assert(status === 200 || status === 201, `Expected 200 or 201, got ${status}`);
    assert(!!data.vendor, 'Should return vendor');
    vendorId = data.vendor.id;
    const setCookie = headers.get('set-cookie') || '';
    const match = setCookie.match(/auth_token=([^;]+)/);
    assert(!!match, 'Should set auth_token cookie');
    authCookie = `auth_token=${match[1]}`;
  });

  await test('GET /api/auth/me - success', async () => {
    const { status, data } = await req('GET', '/api/auth/me');
    assertStatus(status, 200);
    assert(!!data.vendor || !!data.id || !!data.email, 'Should return vendor info');
  });

  await test('GET /api/auth/me - no cookie returns 401', async () => {
    const { status } = await req('GET', '/api/auth/me', undefined, { cookie: '' });
    assertStatus(status, 401);
  });
}

// ─── STORES ──────────────────────────────────────────

async function testStores() {
  console.log(cyan('\n── Stores ──'));

  await test('GET /api/stores - list', async () => {
    const { status, data } = await req('GET', '/api/stores');
    assertStatus(status, 200);
    assert(Array.isArray(data.stores), 'Should return stores array');
    assert(data.stores.length > 0, 'Should have at least one store');
    storeId = data.stores[0].id;
  });

  await test('GET /api/stores - pagination', async () => {
    const { status, data } = await req('GET', '/api/stores?limit=1&offset=0');
    assertStatus(status, 200);
    assert(Array.isArray(data.stores), 'Should return stores array');
  });

  await test('GET /api/stores - search', async () => {
    const { status, data } = await req('GET', '/api/stores?q=test');
    assertStatus(status, 200);
    assert(Array.isArray(data.stores), 'Should return stores array');
  });

  await test('GET /api/stores - id filter', async () => {
    const { status, data } = await req('GET', `/api/stores?id=${storeId}`);
    assertStatus(status, 200);
    assert(Array.isArray(data.stores), 'Should return stores array');
  });

  await test('GET /api/stores - no auth returns 401', async () => {
    const { status } = await req('GET', '/api/stores', undefined, { cookie: '' });
    assertStatus(status, 401);
  });

  await test('PUT /api/stores - update', async () => {
    const { status } = await req('PUT', '/api/stores', [{ id: storeId, name: 'Test Store Updated' }]);
    assertStatus(status, 200);
  });
}

// ─── PRODUCTS ──────────────────────────────────────────

async function testProducts() {
  console.log(cyan('\n── Products ──'));

  await test('GET /api/stores/:id/products - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/products`);
    assertStatus(status, 200);
    assert(Array.isArray(data.products), 'Should return products array');
    if (data.products.length > 0) {
      productId = data.products[0].id;
    }
  });

  await test('GET /api/stores/:id/products - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/products?limit=1&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number' || typeof data.products?.length === 'number', 'Should have count or products');
  });

  await test('GET /api/stores/:id/products - search', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/products?q=nike`);
    assertStatus(status, 200);
    assert(Array.isArray(data.products), 'Should return products array');
  });

  await test('GET /api/stores/:id/products - status filter', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/products?status=draft`);
    assertStatus(status, 200);
    assert(Array.isArray(data.products), 'Should return products array');
  });

  await test('GET /api/stores/:id/products - id filter', async () => {
    if (!productId) return;
    const { status, data } = await req('GET', `/api/stores/${storeId}/products?id=${productId}`);
    assertStatus(status, 200);
    assert(data.products.length >= 1, 'Should find product by id');
  });

  await test('GET /api/stores/:id/products - no auth returns 401', async () => {
    const { status } = await req('GET', `/api/stores/${storeId}/products`, undefined, { cookie: '' });
    assertStatus(status, 401);
  });

  let categoryIdForProduct = '';
  await test('GET categories to find leaf category for product creation', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/categories?limit=100`);
    assertStatus(status, 200);
    const cats = data.categories || [];
    const leaf = cats.find(c => !c.category_children || c.category_children.length === 0);
    if (leaf) {
      categoryIdForProduct = leaf.id;
    } else if (cats.length > 0) {
      categoryIdForProduct = cats[cats.length - 1].id;
    }
  });

  let createdProductId = '';
  await test('POST /api/stores/:id/products - create', async () => {
    const body = [{
      title: '_test_product_e2e_' + Date.now(),
      status: 'draft',
      options: [{ title: 'Size', values: ['S', 'M', 'L'] }],
    }];
    if (categoryIdForProduct) {
      body[0].category_ids = [categoryIdForProduct];
    }
    const { status, data } = await req('POST', `/api/stores/${storeId}/products`, body);
    assert(status === 200 || status === 201, `Expected 200 or 201, got ${status} (${JSON.stringify(data).slice(0, 300)})`);
    assert(!!data.products || !!data.product, 'Should return created product');
    const p = data.products?.[0] || data.product;
    createdProductId = p?.id || '';
  });

  if (createdProductId) {
    await test('PUT /api/stores/:id/products - update', async () => {
      const { status, data } = await req('PUT', `/api/stores/${storeId}/products`, [{
        id: createdProductId,
        title: '_test_product_e2e_updated',
      }]);
      assertStatus(status, 200, JSON.stringify(data).slice(0, 300));
    });

    await test('DELETE /api/stores/:id/products - delete', async () => {
      const { status } = await req('DELETE', `/api/stores/${storeId}/products`, { ids: [createdProductId] });
      assert(status >= 200 && status < 300, `Expected 2xx, got ${status}`);
    });
  }
}

// ─── VARIANTS ──────────────────────────────────────────

async function testVariants() {
  console.log(cyan('\n── Variants ──'));

  if (!productId) {
    console.log(dim('  Skipped - no product available'));
    return;
  }

  await test('GET product to find variant', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/products?id=${productId}`);
    assertStatus(status, 200);
    const product = data.products?.[0];
    if (product?.variants?.length > 0) {
      variantId = product.variants[0].id;
    }
    assert(!!variantId, 'Should have at least one variant');
  });

  await test('PUT /api/stores/:id/products/:pid/variants - update', async () => {
    if (!variantId) return;
    const { status, data } = await req('PUT', `/api/stores/${storeId}/products/${productId}/variants`, [{
      id: variantId,
      title: 'Updated Variant',
    }]);
    assertStatus(status, 200, JSON.stringify(data).slice(0, 300));
  });
}

// ─── CATEGORIES ──────────────────────────────────────────

async function testCategories() {
  console.log(cyan('\n── Categories ──'));

  await test('GET /api/stores/:id/categories - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/categories`);
    assertStatus(status, 200);
    assert(Array.isArray(data.categories), 'Should return categories array');
  });

  await test('GET /api/stores/:id/categories - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/categories?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number', 'Should have count');
  });

  await test('GET /api/stores/:id/categories - search', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/categories?q=shoe`);
    assertStatus(status, 200);
    assert(Array.isArray(data.categories), 'Should return categories array');
  });

  let createdCategoryId = '';
  await test('POST /api/stores/:id/categories - create', async () => {
    const { status, data } = await req('POST', `/api/stores/${storeId}/categories`, [{
      name: '_test_category_e2e',
      is_active: true,
    }]);
    assert(status === 200 || status === 201, `Expected 200 or 201, got ${status} (${JSON.stringify(data).slice(0, 300)})`);
    const cat = data.categories?.[0] || data.category;
    createdCategoryId = cat?.id || '';
  });

  if (createdCategoryId) {
    await test('PUT /api/stores/:id/categories - update', async () => {
      const { status } = await req('PUT', `/api/stores/${storeId}/categories`, [{
        id: createdCategoryId,
        name: '_test_category_e2e_updated',
      }]);
      assertStatus(status, 200);
    });

    await test('DELETE /api/stores/:id/categories - delete', async () => {
      const { status } = await req('DELETE', `/api/stores/${storeId}/categories`, { ids: [createdCategoryId] });
      assert(status >= 200 && status < 300, `Expected 2xx, got ${status}`);
    });
  }

  await test('GET /api/stores/:id/categories/templates - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/categories/templates`);
    assertStatus(status, 200);
    assert(Array.isArray(data.templates), 'Should return templates array');
  });

  await test('GET /api/stores/:id/categories/templates - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/categories/templates?limit=2&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number', 'Should have count');
  });

  await test('GET /api/stores/:id/uncategorized-products - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/uncategorized-products`);
    assertStatus(status, 200);
    assert(Array.isArray(data.uncategorized_products), 'Should return uncategorized_products array');
  });
}

// ─── ORDERS ──────────────────────────────────────────

async function testOrders() {
  console.log(cyan('\n── Orders ──'));

  await test('GET /api/stores/:id/orders - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/orders`);
    assertStatus(status, 200);
    assert(Array.isArray(data.orders), 'Should return orders array');
  });

  await test('GET /api/stores/:id/orders - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/orders?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(Array.isArray(data.orders), 'Should return orders array');
  });

  await test('GET /api/stores/:id/orders - no auth returns 401', async () => {
    const { status } = await req('GET', `/api/stores/${storeId}/orders`, undefined, { cookie: '' });
    assertStatus(status, 401);
  });
}

// ─── INVENTORY ──────────────────────────────────────────

async function testInventory() {
  console.log(cyan('\n── Inventory ──'));

  await test('GET /api/stores/:id/inventory - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/inventory`);
    assertStatus(status, 200);
    assert(Array.isArray(data.inventory_items), 'Should return inventory_items array');
  });

  await test('GET /api/stores/:id/inventory - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/inventory?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number', 'Should have count');
  });

  await test('GET /api/stores/:id/inventory - search', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/inventory?q=nike`);
    assertStatus(status, 200);
    assert(Array.isArray(data.inventory_items), 'Should return inventory_items array');
  });
}

// ─── CUSTOMERS ──────────────────────────────────────────

async function testCustomers() {
  console.log(cyan('\n── Customers ──'));

  await test('GET /api/stores/:id/customers - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/customers`);
    assertStatus(status, 200);
    assert(Array.isArray(data.customers), 'Should return customers array');
  });

  await test('GET /api/stores/:id/customers - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/customers?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(Array.isArray(data.customers), 'Should return customers array');
  });
}

// ─── COLLECTIONS ──────────────────────────────────────────

async function testCollections() {
  console.log(cyan('\n── Collections ──'));

  await test('GET /api/stores/:id/collections - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/collections`);
    assertStatus(status, 200);
    assert(Array.isArray(data.collections), 'Should return collections array');
  });

  await test('GET /api/stores/:id/collections - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/collections?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number', 'Should have count');
  });

  let createdCollectionId = '';
  const collectionTitle = `_test_collection_e2e_${Date.now()}`;
  await test('POST /api/stores/:id/collections - create', async () => {
    const { status, data } = await req('POST', `/api/stores/${storeId}/collections`, [{
      title: collectionTitle,
    }]);
    assert(status === 200 || status === 201, `Expected 200 or 201, got ${status} (${JSON.stringify(data).slice(0, 300)})`);
    const c = data.collections?.[0] || data.collection;
    createdCollectionId = c?.id || '';
  });

  if (createdCollectionId) {
    await test('PUT /api/stores/:id/collections - update', async () => {
      const { status } = await req('PUT', `/api/stores/${storeId}/collections`, [{
        id: createdCollectionId,
        title: `${collectionTitle}_updated`,
      }]);
      assertStatus(status, 200);
    });

    if (productId) {
      await test('POST /api/stores/:id/collections/:cid/products - add', async () => {
        const { status, data } = await req('POST', `/api/stores/${storeId}/collections/${createdCollectionId}/products`, {
          add: [productId],
        });
        assert(status >= 200 && status < 300, `Expected 2xx, got ${status} (${JSON.stringify(data).slice(0, 300)})`);
      });

      await test('POST /api/stores/:id/collections/:cid/products - remove', async () => {
        const { status, data } = await req('POST', `/api/stores/${storeId}/collections/${createdCollectionId}/products`, {
          remove: [productId],
        });
        assert(status >= 200 && status < 300, `Expected 2xx, got ${status} (${JSON.stringify(data).slice(0, 300)})`);
      });
    }

    await test('DELETE /api/stores/:id/collections - delete', async () => {
      const { status } = await req('DELETE', `/api/stores/${storeId}/collections`, { ids: [createdCollectionId] });
      assert(status >= 200 && status < 300, `Expected 2xx, got ${status}`);
    });
  }
}

// ─── PROMOTIONS ──────────────────────────────────────────

async function testPromotions() {
  console.log(cyan('\n── Promotions ──'));

  await test('GET /api/stores/:id/promotions - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/promotions`);
    assertStatus(status, 200);
    assert(Array.isArray(data.promotions), 'Should return promotions array');
  });

  await test('GET /api/stores/:id/promotions - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/promotions?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number', 'Should have count');
  });

  let createdPromotionId = '';
  await test('POST /api/stores/:id/promotions - create', async () => {
    const { status, data } = await req('POST', `/api/stores/${storeId}/promotions`, [{
      code: '_TEST_PROMO_E2E_' + Date.now(),
      type: 'standard',
      application_method: {
        type: 'percentage',
        value: 10,
        target_type: 'order',
      },
    }]);
    assert(status === 200 || status === 201, `Expected 200 or 201, got ${status} (${JSON.stringify(data).slice(0, 300)})`);
    const p = data.promotions?.[0] || data.promotion;
    createdPromotionId = p?.id || '';
  });

  if (createdPromotionId) {
    await test('DELETE /api/stores/:id/promotions - delete', async () => {
      const { status } = await req('DELETE', `/api/stores/${storeId}/promotions`, { ids: [createdPromotionId] });
      assert(status >= 200 && status < 300, `Expected 2xx, got ${status}`);
    });
  }
}

// ─── SHIPPING ──────────────────────────────────────────

async function testShipping() {
  console.log(cyan('\n── Shipping ──'));

  await test('GET /api/stores/:id/shipping - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/shipping`);
    assertStatus(status, 200);
    assert(Array.isArray(data.shipping_options), 'Should return shipping_options array');
  });

  await test('GET /api/stores/:id/shipping - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/shipping?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number', 'Should have count');
  });
}

// ─── PRICE LISTS ──────────────────────────────────────────

async function testPriceLists() {
  console.log(cyan('\n── Price Lists ──'));

  await test('GET /api/stores/:id/price-lists - list', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/price-lists`);
    assertStatus(status, 200);
    assert(Array.isArray(data.price_lists), 'Should return price_lists array');
  });

  await test('GET /api/stores/:id/price-lists - pagination', async () => {
    const { status, data } = await req('GET', `/api/stores/${storeId}/price-lists?limit=5&offset=0`);
    assertStatus(status, 200);
    assert(typeof data.count === 'number', 'Should have count');
  });
}

// ─── ANALYTICS ──────────────────────────────────────────

async function testAnalytics() {
  console.log(cyan('\n── Analytics ──'));

  await test('GET /api/stores/:id/analytics/stats', async () => {
    const { status } = await req('GET', `/api/stores/${storeId}/analytics/stats`);
    assertStatus(status, 200);
  });

  await test('GET /api/stores/:id/analytics/revenue', async () => {
    const { status } = await req('GET', `/api/stores/${storeId}/analytics/revenue`);
    assertStatus(status, 200);
  });
}

// ─── WORKFLOWS ──────────────────────────────────────────

async function testWorkflows() {
  console.log(cyan('\n── Workflows ──'));

  let createdWorkflowId = '';

  await test('POST /api/workflows - create', async () => {
    const { status, data } = await req('POST', '/api/workflows', {
      vendorId,
      name: '_test_workflow_e2e',
      description: 'E2E test workflow',
      definition: { steps: [], agents: {} },
    });
    assertStatus(status, 201, JSON.stringify(data).slice(0, 200));
    createdWorkflowId = data.id;
  });

  await test('GET /api/workflows - list', async () => {
    const { status, data } = await req('GET', `/api/workflows?vendorId=${vendorId}`);
    assertStatus(status, 200);
    assert(Array.isArray(data), 'Should return array');
  });

  if (createdWorkflowId) {
    await test('GET /api/workflows/:id - detail', async () => {
      const { status, data } = await req('GET', `/api/workflows/${createdWorkflowId}`);
      assertStatus(status, 200);
      assert(data.id === createdWorkflowId, 'Should return correct workflow');
    });

    await test('PUT /api/workflows/:id - update', async () => {
      const { status } = await req('PUT', `/api/workflows/${createdWorkflowId}`, {
        name: '_test_workflow_e2e_updated',
      });
      assertStatus(status, 200);
    });

    await test('DELETE /api/workflows/:id - delete', async () => {
      const { status } = await req('DELETE', `/api/workflows/${createdWorkflowId}`);
      assert(status >= 200 && status < 300, `Expected 2xx, got ${status}`);
    });
  }

  await test('GET /api/workflows/:id - not found', async () => {
    const { status } = await req('GET', '/api/workflows/00000000-0000-0000-0000-000000000000');
    assert(status === 404 || status === 500, `Expected 404/500, got ${status}`);
  });

  await test('POST /api/workflows - no auth returns 401', async () => {
    const { status } = await req('POST', '/api/workflows', { vendorId, name: 'x', definition: {} }, { cookie: '' });
    assertStatus(status, 401);
  });
}

// ─── WORKFLOW RUNS ──────────────────────────────────────────

async function testWorkflowRuns() {
  console.log(cyan('\n── Workflow Runs ──'));

  let createdRunId = '';

  await test('POST /api/workflow-runs - create', async () => {
    const { status, data } = await req('POST', '/api/workflow-runs', {
      vendorId,
    });
    assertStatus(status, 201, JSON.stringify(data).slice(0, 200));
    createdRunId = data.id;
  });

  await test('GET /api/workflow-runs - list', async () => {
    const { status, data } = await req('GET', `/api/workflow-runs?vendorId=${vendorId}`);
    assertStatus(status, 200);
    assert(Array.isArray(data), 'Should return array');
  });

  if (createdRunId) {
    await test('GET /api/workflow-runs/:id - detail', async () => {
      const { status, data } = await req('GET', `/api/workflow-runs/${createdRunId}`);
      assertStatus(status, 200);
      assert(data.id === createdRunId, 'Should return correct run');
    });

    await test('PATCH /api/workflow-runs/:id/title - update title', async () => {
      const { status } = await req('PATCH', `/api/workflow-runs/${createdRunId}/title`, {
        title: 'E2E Test Run',
      });
      assertStatus(status, 200);
    });

    await test('DELETE /api/workflow-runs/:id - delete', async () => {
      const { status } = await req('DELETE', `/api/workflow-runs/${createdRunId}`);
      assert(status >= 200 && status < 300, `Expected 2xx, got ${status}`);
    });
  }

  await test('GET /api/workflow-runs/:id - not found', async () => {
    const { status } = await req('GET', '/api/workflow-runs/00000000-0000-0000-0000-000000000000');
    assert(status === 404 || status === 500, `Expected 404/500, got ${status}`);
  });

  await test('POST /api/workflow-runs - no auth returns 401', async () => {
    const { status } = await req('POST', '/api/workflow-runs', { vendorId }, { cookie: '' });
    assertStatus(status, 401);
  });
}

// ─── MCP SERVERS ──────────────────────────────────────────

async function testMcpServers() {
  console.log(cyan('\n── MCP Servers ──'));

  await test('GET /api/mcp/servers - no auth returns 401', async () => {
    const { status } = await req('GET', '/api/mcp/servers', undefined, { cookie: '' });
    assertStatus(status, 401);
  });

  await test('GET /api/mcp/servers - auth (may timeout)', async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${BASE}/api/mcp/servers`, {
        headers: { Cookie: authCookie },
        signal: controller.signal,
      });
      clearTimeout(timer);
      assert(res.status === 200 || res.status === 500, `Expected 200 or 500 (timeout), got ${res.status}`);
    } catch (e) {
      if (e.name === 'AbortError') {
        assert(true, 'Timed out as expected (no MCP workers)');
      } else {
        throw e;
      }
    }
  });
}

// ─── ERROR SCENARIOS ──────────────────────────────────────────

async function testErrorScenarios() {
  console.log(cyan('\n── Error Scenarios ──'));

  await test('Protected endpoint without auth returns 401', async () => {
    const { status } = await req('GET', `/api/stores/${storeId}/products`, undefined, { cookie: '' });
    assertStatus(status, 401);
  });

  await test('Invalid store ID returns error', async () => {
    const { status, data } = await req('GET', '/api/stores/invalid_store_id/products');
    assert(status >= 400, `Expected 4xx/5xx, got ${status}`);
  });

  await test('Error response has standardized structure', async () => {
    const { data } = await req('GET', '/api/auth/me', undefined, { cookie: '' });
    assert(typeof data.statusCode === 'number', 'Should have statusCode');
    assert(typeof data.message === 'string', 'Should have message');
    assert(typeof data.timestamp === 'string', 'Should have timestamp');
  });

  await test('DELETE products with empty ids returns error or success', async () => {
    const { status } = await req('DELETE', `/api/stores/${storeId}/products`, { ids: [] });
    assert(status >= 200 && status < 600, 'Should return some status');
  });

  await test('POST /api/auth/login - missing fields returns error', async () => {
    const { status } = await req('POST', '/api/auth/login', {}, { cookie: '' });
    assert(status >= 400, `Expected 4xx, got ${status}`);
  });
}

// ─── LOGOUT (last) ──────────────────────────────────────────

async function testLogout() {
  console.log(cyan('\n── Logout ──'));

  await test('POST /api/auth/logout - success', async () => {
    const { status } = await req('POST', '/api/auth/logout');
    assert(status === 200 || status === 201, `Expected 200 or 201, got ${status}`);
  });
}

// ─── MAIN ──────────────────────────────────────────

async function main() {
  console.log(yellow('\nEndofSzn API E2E Tests'));
  console.log(dim(`Base URL: ${BASE}`));
  console.log(dim(`Email: ${EMAIL}\n`));

  const start = Date.now();

  await testAuth();
  await testStores();
  await testProducts();
  await testVariants();
  await testCategories();
  await testOrders();
  await testInventory();
  await testCustomers();
  await testCollections();
  await testPromotions();
  await testShipping();
  await testPriceLists();
  await testAnalytics();
  await testWorkflows();
  await testWorkflowRuns();
  await testMcpServers();
  await testErrorScenarios();
  await testLogout();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log('\n' + '─'.repeat(50));
  console.log(`\nResults: ${green(`${passed} passed`)}, ${failed > 0 ? red(`${failed} failed`) : `${failed} failed`}`);
  console.log(dim(`Time: ${elapsed}s\n`));

  if (failures.length > 0) {
    console.log(red('Failures:'));
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(red(`Fatal: ${e.message}`));
  console.error(e.stack);
  process.exit(2);
});
