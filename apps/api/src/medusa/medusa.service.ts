import { Injectable } from '@nestjs/common';
import { MedusaRepository, MedusaCustomer } from './medusa.repository';

@Injectable()
export class MedusaService {
  constructor(private readonly repository: MedusaRepository) {}

  async authRegister(
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    return this.repository.authRegister(email, password);
  }

  async authLogin(email: string, password: string): Promise<{ token: string }> {
    return this.repository.authLogin(email, password);
  }

  async createCustomer(
    token: string,
    data: { email: string; first_name: string; last_name: string },
  ): Promise<{ customer: MedusaCustomer }> {
    return this.repository.createCustomer(token, data);
  }

  async getCustomer(token: string): Promise<{ customer: MedusaCustomer }> {
    return this.repository.getCustomer(token);
  }

  async health(): Promise<{ status: string; medusaUrl: string }> {
    return this.repository.health();
  }
}
