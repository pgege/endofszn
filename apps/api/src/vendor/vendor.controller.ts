import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { VendorService } from './vendor.service';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginVendorDto } from './dto/login-vendor.dto';
import {
  AuthToken,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  ApiException,
} from '../common';
import { CatalogService } from '../catalog';
import { OrdersService } from '../orders';
import { InventoryService } from '../inventory';
import { CustomersService } from '../customers';
import { PromotionsService } from '../promotions';
import { CollectionsService } from '../collections';
import { ShippingService } from '../shipping';
import { PricingService } from '../pricing';
import { AnalyticsService } from '../analytics';

function parseArrayParam(value: any): string[] | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value : [value];
}

function safeParseInt(value: any, fallback: undefined): number | undefined {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseListQuery(query: Record<string, any>) {
  return {
    id: parseArrayParam(query.id),
    limit: safeParseInt(query.limit, undefined),
    offset: safeParseInt(query.offset, undefined),
    q: query.q,
    order: query.order,
  };
}

function requireIdsArray(body: any, field: string = 'ids'): string[] {
  const ids = body?.[field];
  if (!Array.isArray(ids) || ids.length === 0) {
    throw ApiException.badRequest(`'${field}' must be a non-empty array`);
  }
  return ids;
}

@Controller('api')
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly catalog: CatalogService,
    private readonly orders: OrdersService,
    private readonly inventory: InventoryService,
    private readonly customers: CustomersService,
    private readonly promotions: PromotionsService,
    private readonly collections: CollectionsService,
    private readonly shipping: ShippingService,
    private readonly pricing: PricingService,
    private readonly analytics: AnalyticsService,
  ) {}

  private requireAuth(token: string | undefined): string {
    if (!token) throw ApiException.unauthorized('Not authenticated');
    return token;
  }

  // ─── Auth ───────────────────────────────────────────────────────────

  @Post('vendors/register')
  async register(@Body() dto: RegisterVendorDto, @Res({ passthrough: true }) res: Response) {
    const { token, vendor } = await this.vendorService.register(dto);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return { vendor };
  }

  @Post('auth/login')
  async login(@Body() dto: LoginVendorDto, @Res({ passthrough: true }) res: Response) {
    const { token, vendor } = await this.vendorService.login(dto);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return { vendor };
  }

  @Get('auth/me')
  async me(@AuthToken() token: string | undefined) {
    const t = this.requireAuth(token);
    return this.vendorService.getMe(t);
  }

  @Post('auth/logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { success: true };
  }

  // ─── Stores ─────────────────────────────────────────────────────────

  @Get('stores')
  async getStores(@AuthToken() token: string | undefined, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.vendorService.getStores(t, parseListQuery(query));
  }

  @Post('stores')
  async createStores(@AuthToken() token: string | undefined, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.vendorService.createStores(t, vendorId, items, 'user');
  }

  @Put('stores')
  async updateStores(@AuthToken() token: string | undefined, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.vendorService.updateStores(t, vendorId, items, 'user');
  }

  @Delete('stores')
  async deleteStores(@AuthToken() token: string | undefined, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body);
    return this.vendorService.deleteStores(t, vendorId, ids, 'user');
  }

  // ─── Products ───────────────────────────────────────────────────────

  @Get('stores/:storeId/products')
  async getProducts(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, any>) {
    const t = this.requireAuth(token);
    return this.catalog.getProducts(t, storeId, {
      ...parseListQuery(query),
      status: parseArrayParam(query.status),
      category_id: parseArrayParam(query.category_id),
      fields: query.fields,
    });
  }

  @Post('stores/:storeId/products')
  async createProducts(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.catalog.createProducts(t, vendorId, storeId, items, 'user');
  }

  @Put('stores/:storeId/products')
  async updateProducts(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.catalog.updateProducts(t, vendorId, storeId, items, 'user');
  }

  @Delete('stores/:storeId/products')
  async deleteProducts(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body);
    return this.catalog.deleteProducts(t, vendorId, storeId, ids, 'user');
  }

  // ─── Variants ───────────────────────────────────────────────────────

  @Post('stores/:storeId/products/:productId/variants')
  async createVariants(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('productId') productId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const variants = body?.variants ?? body;
    const items = Array.isArray(variants) ? variants : [variants];
    return this.catalog.createVariants(t, vendorId, storeId, productId, items, 'user');
  }

  @Put('stores/:storeId/products/:productId/variants')
  async updateVariants(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('productId') productId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.catalog.updateVariants(t, vendorId, storeId, productId, items, 'user');
  }

  @Delete('stores/:storeId/products/:productId/variants')
  async deleteVariants(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('productId') productId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body, 'variant_ids');
    return this.catalog.deleteVariants(t, vendorId, storeId, productId, ids, 'user');
  }

  // ─── Variant Images ─────────────────────────────────────────────────

  @Post('stores/:storeId/products/:productId/variants/:variantId/images')
  async updateVariantImages(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('productId') productId: string, @Param('variantId') variantId: string, @Body() body: { add?: string[]; remove?: string[] }) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    if (body.add && !Array.isArray(body.add)) throw ApiException.badRequest("'add' must be an array of image URLs");
    if (body.remove && !Array.isArray(body.remove)) throw ApiException.badRequest("'remove' must be an array of image URLs");
    return this.catalog.updateVariantImages(t, vendorId, storeId, productId, variantId, body, 'user');
  }

  // ─── Media ──────────────────────────────────────────────────────────

  @Post('uploads')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(@AuthToken() token: string | undefined, @UploadedFiles() files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>) {
    const t = this.requireAuth(token);
    if (!files || files.length === 0) throw ApiException.badRequest('No files provided');
    return this.catalog.uploadFiles(t, files);
  }

  // ─── Categories ─────────────────────────────────────────────────────

  @Get('stores/:storeId/categories')
  async getCategories(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.catalog.getCategories(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/categories')
  async createCategories(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.catalog.createCategories(t, vendorId, storeId, items, 'user');
  }

  @Put('stores/:storeId/categories')
  async updateCategories(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.catalog.updateCategories(t, vendorId, storeId, items, 'user');
  }

  @Delete('stores/:storeId/categories')
  async deleteCategories(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body);
    return this.catalog.deleteCategories(t, vendorId, storeId, ids, 'user');
  }

  @Get('stores/:storeId/categories/templates')
  async getCategoryTemplates(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: any) {
    const t = this.requireAuth(token);
    return this.catalog.getCategoryTemplates(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/categories/apply-template')
  async applyCategoryTemplate(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: { template_id: string }) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    return this.catalog.applyCategoryTemplate(t, vendorId, storeId, body, 'user');
  }

  @Get('stores/:storeId/uncategorized-products')
  async getUncategorizedProducts(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: any) {
    const t = this.requireAuth(token);
    return this.catalog.getUncategorizedProducts(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/bulk-categorize')
  async bulkCategorize(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: { assignments: Array<{ product_id: string; category_ids: string[] }> }) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    return this.catalog.bulkCategorize(t, vendorId, storeId, body, 'user');
  }

  // ─── Product Options ────────────────────────────────────────────────

  @Put('stores/:storeId/products/:productId/options')
  async updateProductOptions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('productId') productId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.catalog.updateProductOptions(t, vendorId, storeId, productId, items, 'user');
  }

  // ─── Orders ─────────────────────────────────────────────────────────

  @Get('stores/:storeId/orders')
  async getOrders(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, any>) {
    const t = this.requireAuth(token);
    return this.orders.getOrders(t, storeId, { ...parseListQuery(query), status: parseArrayParam(query.status) });
  }

  @Post('stores/:storeId/orders/:orderId/fulfillments')
  async createFulfillment(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('orderId') orderId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    return this.orders.createFulfillment(t, vendorId, storeId, orderId, body, 'user');
  }

  @Post('stores/:storeId/orders/:orderId/cancel')
  async cancelOrder(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('orderId') orderId: string) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    return this.orders.cancelOrder(t, vendorId, storeId, orderId, 'user');
  }

  // ─── Inventory ──────────────────────────────────────────────────────

  @Get('stores/:storeId/inventory')
  async getInventory(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.inventory.getInventory(t, storeId, parseListQuery(query));
  }

  @Put('stores/:storeId/inventory')
  async updateInventoryItems(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.inventory.updateInventoryItems(t, vendorId, storeId, items, 'user');
  }

  // ─── Stock Locations ────────────────────────────────────────────────

  @Get('stores/:storeId/stock-locations')
  async getStockLocations(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.inventory.getStockLocations(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/stock-locations')
  async createStockLocations(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    return this.inventory.createStockLocations(t, vendorId, storeId, body, 'user');
  }

  @Put('stores/:storeId/stock-locations')
  async updateStockLocations(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    return this.inventory.updateStockLocations(t, vendorId, storeId, body, 'user');
  }

  @Delete('stores/:storeId/stock-locations')
  async deleteStockLocations(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    return this.inventory.deleteStockLocations(t, vendorId, storeId, body.ids, 'user');
  }

  // ─── Customers ──────────────────────────────────────────────────────

  @Get('stores/:storeId/customers')
  async getCustomers(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.customers.getCustomers(t, storeId, parseListQuery(query));
  }

  // ─── Promotions ─────────────────────────────────────────────────────

  @Get('stores/:storeId/promotions')
  async getPromotions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.promotions.getPromotions(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/promotions')
  async createPromotions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.promotions.createPromotions(t, vendorId, storeId, items, 'user');
  }

  @Put('stores/:storeId/promotions')
  async updatePromotions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.promotions.updatePromotions(t, vendorId, storeId, items, 'user');
  }

  @Delete('stores/:storeId/promotions')
  async deletePromotions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body);
    return this.promotions.deletePromotions(t, vendorId, storeId, ids, 'user');
  }

  // ─── Collections ────────────────────────────────────────────────────

  @Get('stores/:storeId/collections')
  async getCollections(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.collections.getCollections(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/collections')
  async createCollections(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.collections.createCollections(t, vendorId, storeId, items, 'user');
  }

  @Put('stores/:storeId/collections')
  async updateCollections(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.collections.updateCollections(t, vendorId, storeId, items, 'user');
  }

  @Delete('stores/:storeId/collections')
  async deleteCollections(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body);
    return this.collections.deleteCollections(t, vendorId, storeId, ids, 'user');
  }

  @Post('stores/:storeId/collections/:collectionId/products')
  async updateCollectionProducts(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Param('collectionId') collectionId: string, @Body() body: { add?: string[]; remove?: string[] }) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    if (body.add && !Array.isArray(body.add)) throw ApiException.badRequest("'add' must be an array of product IDs");
    if (body.remove && !Array.isArray(body.remove)) throw ApiException.badRequest("'remove' must be an array of product IDs");
    return this.collections.updateCollectionProducts(t, vendorId, storeId, collectionId, body, 'user');
  }

  // ─── Shipping ───────────────────────────────────────────────────────

  @Get('stores/:storeId/shipping')
  async getShippingOptions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.shipping.getShippingOptions(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/shipping')
  async createShippingOptions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.shipping.createShippingOptions(t, vendorId, storeId, items, 'user');
  }

  @Put('stores/:storeId/shipping')
  async updateShippingOptions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.shipping.updateShippingOptions(t, vendorId, storeId, items, 'user');
  }

  @Delete('stores/:storeId/shipping')
  async deleteShippingOptions(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body);
    return this.shipping.deleteShippingOptions(t, vendorId, storeId, ids, 'user');
  }

  // ─── Price Lists ────────────────────────────────────────────────────

  @Get('stores/:storeId/price-lists')
  async getPriceLists(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Query() query: Record<string, string>) {
    const t = this.requireAuth(token);
    return this.pricing.getPriceLists(t, storeId, parseListQuery(query));
  }

  @Post('stores/:storeId/price-lists')
  async createPriceLists(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.pricing.createPriceLists(t, vendorId, storeId, items, 'user');
  }

  @Put('stores/:storeId/price-lists')
  async updatePriceLists(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const items = Array.isArray(body) ? body : [body];
    return this.pricing.updatePriceLists(t, vendorId, storeId, items, 'user');
  }

  @Delete('stores/:storeId/price-lists')
  async deletePriceLists(@AuthToken() token: string | undefined, @Param('storeId') storeId: string, @Body() body: any) {
    const t = this.requireAuth(token);
    const vendorId = await this.vendorService.getVendorId(t);
    const ids = requireIdsArray(body);
    return this.pricing.deletePriceLists(t, vendorId, storeId, ids, 'user');
  }

  // ─── Analytics ──────────────────────────────────────────────────────

  @Get('stores/:storeId/analytics/stats')
  async getStoreStats(@AuthToken() token: string | undefined, @Param('storeId') storeId: string) {
    const t = this.requireAuth(token);
    return this.analytics.getStoreStats(t, storeId);
  }

  @Get('stores/:storeId/analytics/revenue')
  async getRevenueStats(@AuthToken() token: string | undefined, @Param('storeId') storeId: string) {
    const t = this.requireAuth(token);
    return this.analytics.getRevenueStats(t, storeId);
  }
}
