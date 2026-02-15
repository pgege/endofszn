import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { ApiException, MedusaException } from '../common';

@Injectable()
export class CustomersService {
  constructor(private readonly medusa: MedusaService) {}

  async getCustomers(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusa.getCustomers(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getCustomers', storeId });
    }
  }

}
