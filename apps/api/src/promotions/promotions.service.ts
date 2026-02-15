import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { StoreSyncService, MutationEvent } from '../events/store-sync.service';
import { ApiException, MedusaException } from '../common';

type Source = 'user' | 'agent';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly medusa: MedusaService,
    private readonly storeSync: StoreSyncService,
  ) {}

  private broadcast(vendorId: string, storeId: string, action: MutationEvent['action'], source: Source, entityIds?: string[]) {
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      store_id: storeId,
      entity: 'promotion',
      action,
      entity_ids: entityIds,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  async getPromotions(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusa.getPromotions(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getPromotions', storeId });
    }
  }

  async createPromotions(token: string, vendorId: string, storeId: string, items: any[], source: Source) {
    try {
      const result = await this.medusa.createPromotions(token, storeId, items);
      const createdIds = result.promotions?.map((p: any) => p.id) || [];
      this.broadcast(vendorId, storeId, 'created', source, createdIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createPromotions', storeId });
    }
  }

  async updatePromotions(token: string, vendorId: string, storeId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updatePromotions(token, storeId, updates);
      const updatedIds = updates.map((u: any) => u.id).filter(Boolean);
      this.broadcast(vendorId, storeId, 'updated', source, updatedIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updatePromotions', storeId });
    }
  }

  async deletePromotions(token: string, vendorId: string, storeId: string, ids: string[], source: Source) {
    try {
      const result = await this.medusa.deletePromotions(token, storeId, ids);
      this.broadcast(vendorId, storeId, 'deleted', source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deletePromotions', storeId });
    }
  }
}
