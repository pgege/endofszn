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

  async vendorAuthRegister(
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    const response = await fetch(
      `${this.baseUrl}/auth/vendor/emailpass/register`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
      },
    );
    return this.handleResponse(response);
  }

  async vendorAuthLogin(
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/vendor/emailpass`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async createVendor(
    registrationToken: string,
    data: {
      email: string;
      first_name?: string;
      last_name?: string;
    },
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

  async getStores(
    token: string,
  ): Promise<{ stores: MedusaStoreWithProfile[] }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async createStore(
    token: string,
    data: CreateStoreInput,
  ): Promise<{ store: MedusaStore; profile: MedusaStoreProfile }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getStore(
    token: string,
    storeId: string,
  ): Promise<{ store: MedusaStore; profile: MedusaStoreProfile }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return this.handleResponse(response);
  }

  async updateStore(
    token: string,
    storeId: string,
    data: UpdateStoreInput,
  ): Promise<{ store: MedusaStore; profile: MedusaStoreProfile }> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteStore(token: string, storeId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/vendors/stores/${storeId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
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

  async getProducts(
    token: string,
    storeId: string,
  ): Promise<{ products: any[] }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      },
    );
    return this.handleResponse(response);
  }

  async createProduct(
    token: string,
    storeId: string,
    data: any,
  ): Promise<{ product: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products`,
      {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async getProduct(
    token: string,
    storeId: string,
    productId: string,
  ): Promise<{ product: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      },
    );
    return this.handleResponse(response);
  }

  async updateProduct(
    token: string,
    storeId: string,
    productId: string,
    data: any,
  ): Promise<{ product: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}`,
      {
        method: 'PUT',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async deleteProduct(
    token: string,
    storeId: string,
    productId: string,
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(token),
      },
    );
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

  async createVariants(
    token: string,
    storeId: string,
    productId: string,
    data: any,
  ): Promise<{ variants: any[] }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants`,
      {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async deleteVariants(
    token: string,
    storeId: string,
    productId: string,
    data: any,
  ): Promise<{ success: boolean; deleted_ids: string[] }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants`,
      {
        method: 'DELETE',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async uploadFiles(
    token: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
  ): Promise<{ files: Array<{ id: string; url: string }> }> {
    const formData = new FormData();

    for (const file of files) {
      const uint8Array = new Uint8Array(file.buffer);
      const blob = new Blob([uint8Array], { type: file.mimetype });
      formData.append('files', blob, file.originalname);
    }

    const response = await fetch(`${this.baseUrl}/vendors/uploads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  async getVariantImages(
    token: string,
    storeId: string,
    productId: string,
    variantId: string,
  ): Promise<{ images: any[] }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants/${variantId}/images`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      },
    );
    return this.handleResponse(response);
  }

  async updateVariantImages(
    token: string,
    storeId: string,
    productId: string,
    variantId: string,
    data: { add?: string[]; remove?: string[] },
  ): Promise<{ images: any[] }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants/${variantId}/images`,
      {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async updateVariant(
    token: string,
    storeId: string,
    productId: string,
    variantId: string,
    data: any,
  ): Promise<{ variant: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/variants/${variantId}`,
      {
        method: 'PUT',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async getCategories(token: string, storeId: string): Promise<{ categories: any[] }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/categories`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      },
    );
    return this.handleResponse(response);
  }

  async createCategory(token: string, storeId: string, data: any): Promise<{ category: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/categories`,
      {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async getCategory(
    token: string,
    storeId: string,
    categoryId: string,
  ): Promise<{ category: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/categories/${categoryId}`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      },
    );
    return this.handleResponse(response);
  }

  async updateCategory(
    token: string,
    storeId: string,
    categoryId: string,
    data: any,
  ): Promise<{ category: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/categories/${categoryId}`,
      {
        method: 'PUT',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

  async deleteCategory(
    token: string,
    storeId: string,
    categoryId: string,
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/categories/${categoryId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(token),
      },
    );
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

  async updateProductOption(
    token: string,
    storeId: string,
    productId: string,
    optionId: string,
    data: any,
  ): Promise<{ option: any }> {
    const response = await fetch(
      `${this.baseUrl}/vendors/stores/${storeId}/products/${productId}/options/${optionId}`,
      {
        method: 'PUT',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      },
    );
    return this.handleResponse(response);
  }

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
}
