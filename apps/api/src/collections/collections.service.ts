import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { StoreSyncService, MutationEvent } from '../events/store-sync.service';
import { ApiException, MedusaException } from '../common';

type Source = 'user' | 'agent';

@Injectable()
export class CollectionsService {
  constructor(
    private readonly medusa: MedusaService,
    private readonly storeSync: StoreSyncService,
  ) {}

  private broadcast(vendorId: string, storeId: string, action: MutationEvent['action'], source: Source, entityIds?: string[]) {
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      store_id: storeId,
      entity: 'collection',
      action,
      entity_ids: entityIds,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  async getCollections(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusa.getCollections(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getCollections', storeId });
    }
  }

  async createCollections(token: string, vendorId: string, storeId: string, items: any[], source: Source) {
    try {
      const result = await this.medusa.createCollections(token, storeId, items);
      const createdIds = result.collections?.map((c: any) => c.id) || [];
      this.broadcast(vendorId, storeId, 'created', source, createdIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createCollections', storeId });
    }
  }

  async updateCollections(token: string, vendorId: string, storeId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updateCollections(token, storeId, updates);
      const updatedIds = updates.map((u: any) => u.id).filter(Boolean);
      this.broadcast(vendorId, storeId, 'updated', source, updatedIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateCollections', storeId });
    }
  }

  async deleteCollections(token: string, vendorId: string, storeId: string, ids: string[], source: Source) {
    try {
      const result = await this.medusa.deleteCollections(token, storeId, ids);
      this.broadcast(vendorId, storeId, 'deleted', source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deleteCollections', storeId });
    }
  }

  async updateCollectionProducts(token: string, vendorId: string, storeId: string, collectionId: string, data: { add?: string[]; remove?: string[] }, source: Source) {
    try {
      const result = await this.medusa.updateCollectionProducts(token, storeId, collectionId, data);
      this.broadcast(vendorId, storeId, 'updated', source, [collectionId]);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateCollectionProducts', storeId, collectionId });
    }
  }
}
