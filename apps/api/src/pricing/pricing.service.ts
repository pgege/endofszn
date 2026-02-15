import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { StoreSyncService, MutationEvent } from '../events/store-sync.service';
import { ApiException, MedusaException } from '../common';

type Source = 'user' | 'agent';

@Injectable()
export class PricingService {
  constructor(
    private readonly medusa: MedusaService,
    private readonly storeSync: StoreSyncService,
  ) {}

  private broadcast(vendorId: string, storeId: string, action: MutationEvent['action'], source: Source, entityIds?: string[]) {
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      store_id: storeId,
      entity: 'price_list',
      action,
      entity_ids: entityIds,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  async getPriceLists(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusa.getPriceLists(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getPriceLists', storeId });
    }
  }

  async createPriceLists(token: string, vendorId: string, storeId: string, items: any[], source: Source) {
    try {
      const result = await this.medusa.createPriceLists(token, storeId, items);
      const createdIds = result.price_lists?.map((p: any) => p.id) || [];
      this.broadcast(vendorId, storeId, 'created', source, createdIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createPriceLists', storeId });
    }
  }

  async updatePriceLists(token: string, vendorId: string, storeId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updatePriceLists(token, storeId, updates);
      const updatedIds = updates.map((u: any) => u.id).filter(Boolean);
      this.broadcast(vendorId, storeId, 'updated', source, updatedIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updatePriceLists', storeId });
    }
  }

  async deletePriceLists(token: string, vendorId: string, storeId: string, ids: string[], source: Source) {
    try {
      const result = await this.medusa.deletePriceLists(token, storeId, ids);
      this.broadcast(vendorId, storeId, 'deleted', source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deletePriceLists', storeId });
    }
  }
}
