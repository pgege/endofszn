import { Injectable } from '@nestjs/common';
import { MedusaException } from '../common';

export interface MedusaVendor {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface MedusaStore {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface MedusaStoreProfile {
  id: string;
  store_id: string;
  description: string | null;
  tagline: string | null;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  address_postal_code: string | null;
  website_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  business_type: string | null;
  tax_id: string | null;
  registration_number: string | null;
  shipping_policy: string | null;
  returns_policy: string | null;
  warranty_policy: string | null;
  is_published: boolean;
  accepts_orders: boolean;
}

export interface MedusaStoreWithProfile {
  id: string;
  name: string;
  created_at?: string;
  profile: MedusaStoreProfile | null;
}

export interface VendorMeResponse {
  vendor: MedusaVendor;
  stores: MedusaStoreWithProfile[];
}

export interface CreateStoreInput {
  name: string;
  description?: string;
  tagline?: string;
  logo_url?: string;
  banner_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  social_links?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
  business_info?: {
    business_type?: string;
    tax_id?: string;
    registration_number?: string;
  };
  default_currency_code?: string;
}

export interface UpdateStoreInput {
  name?: string;
  description?: string;
  tagline?: string;
  logo_url?: string | null;
  banner_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_country?: string | null;
  address_postal_code?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  business_type?: string | null;
  tax_id?: string | null;
  registration_number?: string | null;
  is_published?: boolean;
  accepts_orders?: boolean;
  default_currency_code?: string;
}

export interface ListParams {
  id?: string[];
  limit?: number;
  offset?: number;
  q?: string;
  order?: string;
}

@Injectable()
export class MedusaRepository {
  private readonly baseUrl: string;

  constructor() {
    const protocol = process.env.MEDUSA_PROTOCOL || 'http';
    const host = process.env.MEDUSA_HOST || 'localhost';
    const port = process.env.MEDUSA_PORT || '9000';
    this.baseUrl = `${protocol}://${host}:${port}`;
  }

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let error = { message: 'Unknown error' };
      try {
        error = await response.json();
      } catch {
        error = { message: response.statusText };
      }
      throw MedusaException.fromResponse(response.status, error);
    }
    return response.json();
  }

  private async handleDeleteResponse(response: Response): Promise<void> {
    if (!response.ok) {
      let error = { message: 'Unknown error' };
      try {
        error = await response.json();
      } catch {
        error = { message: response.statusText };
      }
      throw MedusaException.fromResponse(response.status, error);
    }
  }

  private buildUrl(path: string, params?: ListParams & Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const v of value) {
              url.searchParams.append(key, String(v));
            }
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
    }
    return url.toString();
  }

  // ─── Auth ───────────────────────────────────────────────────────────

  async vendorAuthRegister(email: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/vendor/emailpass/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async vendorAuthLogin(email: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/vendor/emailpass`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async createVendor(
    registrationToken: string,
    data: { email: string; first_name?: string; last_name?: string },
  ): Promise<{ vendor: MedusaVendor }> {
    const response = await fetch(`${this.baseUrl}/vendors`, {
      method: 'POST',
      headers: this.getHeaders(registrationToken),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async vendorMe(token: string): Promise<VendorMeResponse> {
    const response = await fetch(`${this.baseUrl}/vendors/me`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  // ─── Stores ─────────────────────────────────────────────────────────

  async getStores(token: string, params?: ListParams): Promise<{ stores: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl('/vendors/stores', params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createStores(token: string, items: CreateStoreInput[]): Promise<{ stores: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(items),
    });
    return this.handleResponse(response);
  }

  async updateStores(token: string, updates: Array<{ id: string } & UpdateStoreInput>): Promise<{ stores: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteStores(token: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  // ─── Products ───────────────────────────────────────────────────────

  async getProducts(
    token: string,
    storeId: string,
    params?: ListParams & { status?: string[]; fields?: string; category_id?: string[] },
  ): Promise<{ products: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/products`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createProducts(token: string, storeId: string, items: any[]): Promise<{ products: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(items),
    });
    return this.handleResponse(response);
  }

  async updateProducts(token: string, storeId: string, updates: any[]): Promise<{ products: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteProducts(token: string, storeId: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  // ─── Variants ───────────────────────────────────────────────────────

  async createVariants(token: string, storeId: string, productId: string, variants: any[]): Promise<{ variants: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ variants }),
    });
    return this.handleResponse(response);
  }

  async updateVariants(token: string, storeId: string, productId: string, updates: any[]): Promise<{ variants: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteVariants(token: string, storeId: string, productId: string, variantIds: string[]): Promise<{ success: boolean; deleted_ids: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ variant_ids: variantIds }),
    });
    return this.handleResponse(response);
  }

  // ─── Product Images ────────────────────────────────────────────────

  async uploadFiles(token: string, files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>): Promise<{ files: Array<{ id: string; url: string }> }> {
    const formData = new FormData();
    for (const file of files) {
      const uint8Array = new Uint8Array(file.buffer);
      const blob = new Blob([uint8Array], { type: file.mimetype });
      formData.append('files', blob, file.originalname);
    }
    const response = await fetch(`${this.baseUrl}/vendors/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async getVariantImages(token: string, storeId: string, productId: string, variantId: string): Promise<{ images: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants/${variantId}/images`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async updateVariantImages(token: string, storeId: string, productId: string, variantId: string, data: { add?: string[]; remove?: string[] }): Promise<{ images: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants/${variantId}/images`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async addProductImages(token: string, storeId: string, productId: string, urls: string[]): Promise<{ images: any[]; all_images: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/images`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ urls }),
    });
    return this.handleResponse(response);
  }

  async deleteProductImages(token: string, storeId: string, productId: string, imageIds: string[]): Promise<{ images: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/images`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ image_ids: imageIds }),
    });
    return this.handleResponse(response);
  }

  async updateProductOptions(token: string, storeId: string, productId: string, updates: any[]): Promise<{ options: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/options`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  // ─── Categories ────────────────────────────────────────────────────

  async getCategories(token: string, storeId: string, params?: ListParams): Promise<{ categories: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/categories`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createCategories(token: string, storeId: string, items: any[]): Promise<{ categories: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/categories`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(items),
    });
    return this.handleResponse(response);
  }

  async updateCategories(token: string, storeId: string, updates: any[]): Promise<{ categories: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/categories`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteCategories(token: string, storeId: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/categories`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  // ─── Orders ─────────────────────────────────────────────────────────

  async getOrders(token: string, storeId: string, params?: ListParams & { status?: string[] }): Promise<{ orders: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/orders`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createFulfillment(token: string, storeId: string, orderId: string, data: any): Promise<{ fulfillment: any }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/orders/${orderId}/fulfillments`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async cancelOrder(token: string, storeId: string, orderId: string): Promise<{ order: any }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  // ─── Inventory ──────────────────────────────────────────────────────

  async getInventory(token: string, storeId: string, params?: ListParams): Promise<{ inventory_items: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/inventory`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async updateInventoryItems(token: string, storeId: string, updates: any[]): Promise<{ inventory_items: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/inventory`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  // ─── Stock Locations ────────────────────────────────────────────────

  async getStockLocations(token: string, storeId: string, params?: ListParams): Promise<{ stock_locations: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/stock-locations`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createStockLocations(token: string, storeId: string, data: { stock_locations: any[]; set_as_default?: boolean }): Promise<{ stock_locations: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/stock-locations`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateStockLocations(token: string, storeId: string, data: { stock_locations: any[] }): Promise<{ stock_locations: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/stock-locations`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteStockLocations(token: string, storeId: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/stock-locations`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  // ─── Customers ──────────────────────────────────────────────────────

  async getCustomers(token: string, storeId: string, params?: ListParams): Promise<{ customers: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/customers`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  // ─── Promotions ─────────────────────────────────────────────────────

  async getPromotions(token: string, storeId: string, params?: ListParams): Promise<{ promotions: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/promotions`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createPromotions(token: string, storeId: string, items: any[]): Promise<{ promotions: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/promotions`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(items),
    });
    return this.handleResponse(response);
  }

  async updatePromotions(token: string, storeId: string, updates: any[]): Promise<{ promotions: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/promotions`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deletePromotions(token: string, storeId: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/promotions`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  // ─── Collections ────────────────────────────────────────────────────

  async getCollections(token: string, storeId: string, params?: ListParams): Promise<{ collections: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/collections`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createCollections(token: string, storeId: string, items: any[]): Promise<{ collections: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/collections`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(items),
    });
    return this.handleResponse(response);
  }

  async updateCollections(token: string, storeId: string, updates: any[]): Promise<{ collections: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/collections`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteCollections(token: string, storeId: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/collections`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  async updateCollectionProducts(token: string, storeId: string, collectionId: string, data: { add?: string[]; remove?: string[] }): Promise<{ collection: any }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/collections/${collectionId}/products`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // ─── Shipping ───────────────────────────────────────────────────────

  async getShippingOptions(token: string, storeId: string, params?: ListParams): Promise<{ shipping_options: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/shipping`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createShippingOptions(token: string, storeId: string, items: any[]): Promise<{ shipping_options: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/shipping`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(items),
    });
    return this.handleResponse(response);
  }

  async updateShippingOptions(token: string, storeId: string, updates: any[]): Promise<{ shipping_options: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/shipping`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deleteShippingOptions(token: string, storeId: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/shipping`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  // ─── Price Lists ────────────────────────────────────────────────────

  async getPriceLists(token: string, storeId: string, params?: ListParams): Promise<{ price_lists: any[]; count: number; limit: number; offset: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/price-lists`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createPriceLists(token: string, storeId: string, items: any[]): Promise<{ price_lists: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/price-lists`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(items),
    });
    return this.handleResponse(response);
  }

  async updatePriceLists(token: string, storeId: string, updates: any[]): Promise<{ price_lists: any[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/price-lists`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(updates),
    });
    return this.handleResponse(response);
  }

  async deletePriceLists(token: string, storeId: string, ids: string[]): Promise<{ deleted: string[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/price-lists`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
      body: JSON.stringify({ ids }),
    });
    return this.handleResponse(response);
  }

  // ─── Utility ────────────────────────────────────────────────────────

  async health(): Promise<{ status: string; medusaUrl: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const text = await response.text();
      return {
        status: text === 'OK' ? 'healthy' : 'unhealthy',
        medusaUrl: this.baseUrl,
      };
    } catch {
      return {
        status: 'unreachable',
        medusaUrl: this.baseUrl,
      };
    }
  }

  async getUncategorizedProducts(token: string, storeId: string, params?: ListParams): Promise<{ uncategorized_products: any[]; count: number; total_products: number }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/uncategorized-products`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async bulkCategorize(token: string, storeId: string, data: { assignments: Array<{ product_id: string; category_ids: string[] }> }): Promise<{ updated_products: any[]; count: number }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/bulk-categorize`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getCategoryTemplates(token: string, storeId: string, params?: ListParams): Promise<{ templates: any[] }> {
    const response = await fetch(this.buildUrl(`/vendors/stores/${storeId}/categories/templates`, params), {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async applyCategoryTemplate(token: string, storeId: string, data: { template_id: string }): Promise<{ message: string; categories: any[]; count: number }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}/categories/apply-template`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }
}
