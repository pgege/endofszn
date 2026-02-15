import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

export interface MutationEvent {
  vendor_id: string;
  store_id?: string;
  entity: 'store' | 'product' | 'variant' | 'category' | 'product_option' | 'order' | 'fulfillment' | 'inventory_item' | 'customer' | 'promotion' | 'collection' | 'shipping_option' | 'price_list' | 'stock_location';
  action: 'created' | 'updated' | 'deleted' | 'bulk_updated';
  entity_id?: string;
  entity_ids?: string[];
  data?: Record<string, unknown>;
  timestamp: string;
  source: 'user' | 'agent';
}

@Injectable()
export class StoreSyncService {
  private readonly logger = new Logger(StoreSyncService.name);
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  broadcastMutation(event: MutationEvent) {
    if (!this.server) {
      this.logger.warn('Cannot broadcast: WebSocket server not set');
      return;
    }

    const room = `vendor:${event.vendor_id}`;
    this.server.to(room).emit('store:entity_changed', event);
    this.logger.debug(
      `Broadcast ${event.entity}:${event.action} to ${room} (source: ${event.source})`,
    );
  }
}
