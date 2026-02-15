import { Injectable } from '@nestjs/common';
import {
  MedusaRepository,
  MedusaVendor,
  VendorMeResponse,
  CreateStoreInput,
  UpdateStoreInput,
  ListParams,
} from './medusa.repository';

@Injectable()
export class MedusaService {
  constructor(private readonly repository: MedusaRepository) {}

  async vendorAuthRegister(email: string, password: string): Promise<{ token: string }> {
    return this.repository.vendorAuthRegister(email, password);
  }

  async vendorAuthLogin(email: string, password: string): Promise<{ token: string }> {
    return this.repository.vendorAuthLogin(email, password);
  }

  async createVendor(registrationToken: string, data: { email: string; first_name?: string; last_name?: string }): Promise<{ vendor: MedusaVendor }> {
    return this.repository.createVendor(registrationToken, data);
  }

  async vendorMe(token: string): Promise<VendorMeResponse> {
    return this.repository.vendorMe(token);
  }

  async getStores(token: string, params?: ListParams) {
    return this.repository.getStores(token, params);
  }

  async createStores(token: string, items: CreateStoreInput[]) {
    return this.repository.createStores(token, items);
  }

  async updateStores(token: string, updates: Array<{ id: string } & UpdateStoreInput>) {
    return this.repository.updateStores(token, updates);
  }

  async deleteStores(token: string, ids: string[]) {
    return this.repository.deleteStores(token, ids);
  }

  async getProducts(token: string, storeId: string, params?: ListParams & { id?: string[]; status?: string[]; fields?: string; category_id?: string[] }) {
    return this.repository.getProducts(token, storeId, params);
  }

  async createProducts(token: string, storeId: string, items: any[]) {
    return this.repository.createProducts(token, storeId, items);
  }

  async updateProducts(token: string, storeId: string, updates: any[]) {
    return this.repository.updateProducts(token, storeId, updates);
  }

  async deleteProducts(token: string, storeId: string, ids: string[]) {
    return this.repository.deleteProducts(token, storeId, ids);
  }

  async createVariants(token: string, storeId: string, productId: string, variants: any[]) {
    return this.repository.createVariants(token, storeId, productId, variants);
  }

  async updateVariants(token: string, storeId: string, productId: string, updates: any[]) {
    return this.repository.updateVariants(token, storeId, productId, updates);
  }

  async deleteVariants(token: string, storeId: string, productId: string, variantIds: string[]) {
    return this.repository.deleteVariants(token, storeId, productId, variantIds);
  }

  async uploadFiles(token: string, files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>) {
    return this.repository.uploadFiles(token, files);
  }

  async getVariantImages(token: string, storeId: string, productId: string, variantId: string) {
    return this.repository.getVariantImages(token, storeId, productId, variantId);
  }

  async updateVariantImages(token: string, storeId: string, productId: string, variantId: string, data: { add?: string[]; remove?: string[] }) {
    return this.repository.updateVariantImages(token, storeId, productId, variantId, data);
  }

  async addProductImages(token: string, storeId: string, productId: string, urls: string[]) {
    return this.repository.addProductImages(token, storeId, productId, urls);
  }

  async deleteProductImages(token: string, storeId: string, productId: string, imageIds: string[]) {
    return this.repository.deleteProductImages(token, storeId, productId, imageIds);
  }

  async updateProductOptions(token: string, storeId: string, productId: string, updates: any[]) {
    return this.repository.updateProductOptions(token, storeId, productId, updates);
  }

  async getCategories(token: string, storeId: string, params?: ListParams) {
    return this.repository.getCategories(token, storeId, params);
  }

  async createCategories(token: string, storeId: string, items: any[]) {
    return this.repository.createCategories(token, storeId, items);
  }

  async updateCategories(token: string, storeId: string, updates: any[]) {
    return this.repository.updateCategories(token, storeId, updates);
  }

  async deleteCategories(token: string, storeId: string, ids: string[]) {
    return this.repository.deleteCategories(token, storeId, ids);
  }

  async getOrders(token: string, storeId: string, params?: ListParams & { id?: string[]; status?: string[] }) {
    return this.repository.getOrders(token, storeId, params);
  }

  async createFulfillment(token: string, storeId: string, orderId: string, data: any) {
    return this.repository.createFulfillment(token, storeId, orderId, data);
  }

  async cancelOrder(token: string, storeId: string, orderId: string) {
    return this.repository.cancelOrder(token, storeId, orderId);
  }

  async getInventory(token: string, storeId: string, params?: ListParams) {
    return this.repository.getInventory(token, storeId, params);
  }

  async updateInventoryItems(token: string, storeId: string, updates: any[]) {
    return this.repository.updateInventoryItems(token, storeId, updates);
  }

  async getStockLocations(token: string, storeId: string, params?: ListParams) {
    return this.repository.getStockLocations(token, storeId, params);
  }

  async createStockLocations(token: string, storeId: string, data: { stock_locations: any[]; set_as_default?: boolean }) {
    return this.repository.createStockLocations(token, storeId, data);
  }

  async updateStockLocations(token: string, storeId: string, data: { stock_locations: any[] }) {
    return this.repository.updateStockLocations(token, storeId, data);
  }

  async deleteStockLocations(token: string, storeId: string, ids: string[]) {
    return this.repository.deleteStockLocations(token, storeId, ids);
  }

  async getCustomers(token: string, storeId: string, params?: ListParams) {
    return this.repository.getCustomers(token, storeId, params);
  }

  async getPromotions(token: string, storeId: string, params?: ListParams) {
    return this.repository.getPromotions(token, storeId, params);
  }

  async createPromotions(token: string, storeId: string, items: any[]) {
    return this.repository.createPromotions(token, storeId, items);
  }

  async updatePromotions(token: string, storeId: string, updates: any[]) {
    return this.repository.updatePromotions(token, storeId, updates);
  }

  async deletePromotions(token: string, storeId: string, ids: string[]) {
    return this.repository.deletePromotions(token, storeId, ids);
  }

  async getCollections(token: string, storeId: string, params?: ListParams) {
    return this.repository.getCollections(token, storeId, params);
  }

  async createCollections(token: string, storeId: string, items: any[]) {
    return this.repository.createCollections(token, storeId, items);
  }

  async updateCollections(token: string, storeId: string, updates: any[]) {
    return this.repository.updateCollections(token, storeId, updates);
  }

  async deleteCollections(token: string, storeId: string, ids: string[]) {
    return this.repository.deleteCollections(token, storeId, ids);
  }

  async updateCollectionProducts(token: string, storeId: string, collectionId: string, data: { add?: string[]; remove?: string[] }) {
    return this.repository.updateCollectionProducts(token, storeId, collectionId, data);
  }

  async getShippingOptions(token: string, storeId: string, params?: ListParams) {
    return this.repository.getShippingOptions(token, storeId, params);
  }

  async createShippingOptions(token: string, storeId: string, items: any[]) {
    return this.repository.createShippingOptions(token, storeId, items);
  }

  async updateShippingOptions(token: string, storeId: string, updates: any[]) {
    return this.repository.updateShippingOptions(token, storeId, updates);
  }

  async deleteShippingOptions(token: string, storeId: string, ids: string[]) {
    return this.repository.deleteShippingOptions(token, storeId, ids);
  }

  async getPriceLists(token: string, storeId: string, params?: ListParams) {
    return this.repository.getPriceLists(token, storeId, params);
  }

  async createPriceLists(token: string, storeId: string, items: any[]) {
    return this.repository.createPriceLists(token, storeId, items);
  }

  async updatePriceLists(token: string, storeId: string, updates: any[]) {
    return this.repository.updatePriceLists(token, storeId, updates);
  }

  async deletePriceLists(token: string, storeId: string, ids: string[]) {
    return this.repository.deletePriceLists(token, storeId, ids);
  }

  async health() {
    return this.repository.health();
  }

  async getUncategorizedProducts(token: string, storeId: string, params?: any) {
    return this.repository.getUncategorizedProducts(token, storeId, params);
  }

  async bulkCategorize(token: string, storeId: string, data: { assignments: Array<{ product_id: string; category_ids: string[] }> }) {
    return this.repository.bulkCategorize(token, storeId, data);
  }

  async getCategoryTemplates(token: string, storeId: string, params?: any) {
    return this.repository.getCategoryTemplates(token, storeId, params);
  }

  async applyCategoryTemplate(token: string, storeId: string, data: { template_id: string }) {
    return this.repository.applyCategoryTemplate(token, storeId, data);
  }
}
