import { Injectable, Logger } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly medusa: MedusaService) {}

  async getStoreStats(token: string, storeId: string) {
    const [products, orders, customers] = await Promise.allSettled([
      this.medusa.getProducts(token, storeId, { limit: 1, offset: 0 }),
      this.medusa.getOrders(token, storeId, { limit: 1, offset: 0 }),
      this.medusa.getCustomers(token, storeId, { limit: 1, offset: 0 }),
    ]);

    return {
      product_count: products.status === 'fulfilled' ? products.value.count : 0,
      order_count: orders.status === 'fulfilled' ? orders.value.count : 0,
      customer_count: customers.status === 'fulfilled' ? customers.value.count : 0,
    };
  }

  async getRevenueStats(token: string, storeId: string) {
    try {
      let allOrders: any[] = [];
      let offset = 0;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const { orders, count } = await this.medusa.getOrders(token, storeId, { limit: pageSize, offset });
        allOrders = allOrders.concat(orders);
        offset += pageSize;
        hasMore = offset < count;
      }

      const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const ordersByMonth: Record<string, { count: number; revenue: number }> = {};

      for (const order of allOrders) {
        const month = new Date(order.created_at).toISOString().slice(0, 7);
        if (!ordersByMonth[month]) ordersByMonth[month] = { count: 0, revenue: 0 };
        ordersByMonth[month].count++;
        ordersByMonth[month].revenue += order.total || 0;
      }

      return {
        total_revenue: totalRevenue,
        orders_by_month: ordersByMonth,
        currency: allOrders[0]?.currency_code || 'usd',
        total_orders: allOrders.length,
      };
    } catch (err: any) {
      this.logger.error(`Failed to get revenue stats for store ${storeId}: ${err.message}`);
      return { total_revenue: 0, orders_by_month: {}, currency: 'usd', total_orders: 0 };
    }
  }
}
