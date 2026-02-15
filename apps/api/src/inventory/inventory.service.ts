import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { StoreSyncService, MutationEvent } from '../events/store-sync.service';
import { ApiException, MedusaException } from '../common';

type Source = 'user' | 'agent';

@Injectable()
export class InventoryService {
  constructor(
    private readonly medusa: MedusaService,
    private readonly storeSync: StoreSyncService,
  ) {}

  private broadcast(vendorId: string, storeId: string, source: Source, entityIds?: string[]) {
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      store_id: storeId,
      entity: 'inventory_item',
      action: 'updated',
      entity_ids: entityIds,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  async getInventory(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusa.getInventory(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getInventory', storeId });
    }
  }

  async updateInventoryItems(token: string, vendorId: string, storeId: string, updates: any[], source: Source) {
    try {
      const result = await this.medusa.updateInventoryItems(token, storeId, updates);
      const updatedIds = updates.map((u: any) => u.id).filter(Boolean);
      this.broadcast(vendorId, storeId, source, updatedIds);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateInventoryItems', storeId });
    }
  }

  private broadcastLocations(vendorId: string, storeId: string, source: Source, entityIds?: string[]) {
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      store_id: storeId,
      entity: 'stock_location',
      action: 'updated',
      entity_ids: entityIds,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  async getStockLocations(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusa.getStockLocations(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getStockLocations', storeId });
    }
  }

  async createStockLocations(token: string, vendorId: string, storeId: string, data: { stock_locations: any[]; set_as_default?: boolean }, source: Source) {
    try {
      const result = await this.medusa.createStockLocations(token, storeId, data);
      this.broadcastLocations(vendorId, storeId, source);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createStockLocations', storeId });
    }
  }

  async updateStockLocations(token: string, vendorId: string, storeId: string, data: { stock_locations: any[] }, source: Source) {
    try {
      const result = await this.medusa.updateStockLocations(token, storeId, data);
      const ids = data.stock_locations.map((l: any) => l.id).filter(Boolean);
      this.broadcastLocations(vendorId, storeId, source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateStockLocations', storeId });
    }
  }

  async deleteStockLocations(token: string, vendorId: string, storeId: string, ids: string[], source: Source) {
    try {
      const result = await this.medusa.deleteStockLocations(token, storeId, ids);
      this.broadcastLocations(vendorId, storeId, source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deleteStockLocations', storeId });
    }
  }
}
