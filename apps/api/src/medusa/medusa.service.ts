import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class MedusaService {
  private readonly baseUrl: string;
  private readonly publishableApiKey: string | undefined;

  constructor() {
    const protocol = process.env.MEDUSA_PROTOCOL || 'http';
    const host = process.env.MEDUSA_HOST || 'localhost';
    const port = process.env.MEDUSA_PORT || '9000';
    this.baseUrl = `${protocol}://${host}:${port}`;
    this.publishableApiKey = process.env.MEDUSA_PUBLISHABLE_API_KEY;
  }

  private getStoreHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.publishableApiKey) {
      headers['x-publishable-api-key'] = this.publishableApiKey;
    }
    return headers;
  }

  async health(): Promise<{ status: string; medusaUrl: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const text = await response.text();
      return {
        status: text === 'OK' ? 'healthy' : 'unhealthy',
        medusaUrl: this.baseUrl,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'unreachable',
          medusaUrl: this.baseUrl,
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getProducts(limit = 10, offset = 0) {
    try {
      const response = await fetch(
        `${this.baseUrl}/store/products?limit=${limit}&offset=${offset}`,
        { headers: this.getStoreHeaders() },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Medusa responded with ${response.status}: ${text}`);
      }
      return response.json();
    } catch (error) {
      throw new HttpException(
        { error: 'Failed to fetch products from Medusa', details: error.message },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getProduct(id: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/store/products/${id}`,
        { headers: this.getStoreHeaders() },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Medusa responded with ${response.status}: ${text}`);
      }
      return response.json();
    } catch (error) {
      throw new HttpException(
        { error: 'Failed to fetch product from Medusa', details: error.message },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getRegions() {
    try {
      const response = await fetch(
        `${this.baseUrl}/store/regions`,
        { headers: this.getStoreHeaders() },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Medusa responded with ${response.status}: ${text}`);
      }
      return response.json();
    } catch (error) {
      throw new HttpException(
        { error: 'Failed to fetch regions from Medusa', details: error.message },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getCollections() {
    try {
      const response = await fetch(
        `${this.baseUrl}/store/collections`,
        { headers: this.getStoreHeaders() },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Medusa responded with ${response.status}: ${text}`);
      }
      return response.json();
    } catch (error) {
      throw new HttpException(
        { error: 'Failed to fetch collections from Medusa', details: error.message },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
