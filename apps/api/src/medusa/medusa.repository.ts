import { Injectable } from '@nestjs/common';
import { MedusaException } from '../common';

export interface MedusaCustomer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class MedusaRepository {
  private readonly baseUrl: string;
  private readonly publishableApiKey: string | undefined;

  constructor() {
    const protocol = process.env.MEDUSA_PROTOCOL || 'http';
    const host = process.env.MEDUSA_HOST || 'localhost';
    const port = process.env.MEDUSA_PORT || '9000';
    this.baseUrl = `${protocol}://${host}:${port}`;
    this.publishableApiKey = process.env.MEDUSA_PUBLISHABLE_API_KEY;
  }

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.publishableApiKey) {
      headers['x-publishable-api-key'] = this.publishableApiKey;
    }
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

  async authRegister(
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    const response = await fetch(
      `${this.baseUrl}/auth/customer/emailpass/register`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
      },
    );
    return this.handleResponse(response);
  }

  async authLogin(email: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${this.baseUrl}/auth/customer/emailpass`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  async createCustomer(
    token: string,
    data: { email: string; first_name: string; last_name: string },
  ): Promise<{ customer: MedusaCustomer }> {
    const response = await fetch(`${this.baseUrl}/store/customers`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getCustomer(token: string): Promise<{ customer: MedusaCustomer }> {
    const response = await fetch(`${this.baseUrl}/store/customers/me`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
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
