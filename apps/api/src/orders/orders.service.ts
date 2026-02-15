import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { StoreSyncService, MutationEvent } from '../events/store-sync.service';
import { ApiException, MedusaException } from '../common';

type Source = 'user' | 'agent';

@Injectable()
export class OrdersService {
  constructor(
    private readonly medusa: MedusaService,
    private readonly storeSync: StoreSyncService,
  ) {}

  private broadcast(vendorId: string, storeId: string, entity: MutationEvent['entity'], action: MutationEvent['action'], source: Source, entityId?: string, entityIds?: string[]) {
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      store_id: storeId,
      entity,
      action,
      entity_id: entityId,
      entity_ids: entityIds,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  async getOrders(token: string, storeId: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[]; status?: string[] }) {
    try {
      return await this.medusa.getOrders(token, storeId, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getOrders', storeId });
    }
  }

  async createFulfillment(token: string, vendorId: string, storeId: string, orderId: string, data: any, source: Source) {
    try {
      const result = await this.medusa.createFulfillment(token, storeId, orderId, data);
      this.broadcast(vendorId, storeId, 'fulfillment', 'created', source, orderId, [orderId]);
      this.broadcast(vendorId, storeId, 'order', 'updated', source, orderId, [orderId]);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createFulfillment', storeId, orderId });
    }
  }

  async cancelOrder(token: string, vendorId: string, storeId: string, orderId: string, source: Source) {
    try {
      const result = await this.medusa.cancelOrder(token, storeId, orderId);
      this.broadcast(vendorId, storeId, 'order', 'updated', source, orderId, [orderId]);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'cancelOrder', storeId, orderId });
    }
  }
}
