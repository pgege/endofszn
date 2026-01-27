import { Injectable } from '@nestjs/common';
import {
  MedusaRepository,
  MedusaVendor,
  MedusaStore,
  MedusaStoreProfile,
  MedusaStoreWithProfile,
  VendorMeResponse,
  CreateStoreInput,
  UpdateStoreInput,
} from './medusa.repository';

@Injectable()
export class MedusaService {
  constructor(private readonly repository: MedusaRepository) {}

  async vendorAuthRegister(
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    return this.repository.vendorAuthRegister(email, password);
  }

  async vendorAuthLogin(
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    return this.repository.vendorAuthLogin(email, password);
  }

  async createVendor(
    registrationToken: string,
    data: {
      email: string;
      first_name?: string;
      last_name?: string;
    },
  ): Promise<{ vendor: MedusaVendor }> {
    return this.repository.createVendor(registrationToken, data);
  }

  async vendorMe(token: string): Promise<VendorMeResponse> {
    return this.repository.vendorMe(token);
  }

  async getStores(token: string): Promise<{ stores: MedusaStoreWithProfile[] }> {
    return this.repository.getStores(token);
  }

  async createStore(
    token: string,
    data: CreateStoreInput,
  ): Promise<{ store: MedusaStore; profile: MedusaStoreProfile }> {
    return this.repository.createStore(token, data);
  }

  async getStore(
    token: string,
    storeId: string,
  ): Promise<{ store: MedusaStore; profile: MedusaStoreProfile }> {
    return this.repository.getStore(token, storeId);
  }

  async updateStore(
    token: string,
    storeId: string,
    data: UpdateStoreInput,
  ): Promise<{ store: MedusaStore; profile: MedusaStoreProfile }> {
    return this.repository.updateStore(token, storeId, data);
  }

  async deleteStore(token: string, storeId: string): Promise<void> {
    return this.repository.deleteStore(token, storeId);
  }

  async getProducts(token: string, storeId: string): Promise<{ products: any[] }> {
    return this.repository.getProducts(token, storeId);
  }

  async createProduct(token: string, storeId: string, data: any): Promise<{ product: any }> {
    return this.repository.createProduct(token, storeId, data);
  }

  async getProduct(token: string, storeId: string, productId: string): Promise<{ product: any }> {
    return this.repository.getProduct(token, storeId, productId);
  }

  async updateProduct(token: string, storeId: string, productId: string, data: any): Promise<{ product: any }> {
    return this.repository.updateProduct(token, storeId, productId, data);
  }

  async deleteProduct(token: string, storeId: string, productId: string): Promise<void> {
    return this.repository.deleteProduct(token, storeId, productId);
  }

  async uploadFiles(
    token: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
  ): Promise<{ files: Array<{ id: string; url: string }> }> {
    return this.repository.uploadFiles(token, files);
  }

  async getVariantImages(
    token: string,
    storeId: string,
    productId: string,
    variantId: string,
  ): Promise<{ images: any[] }> {
    return this.repository.getVariantImages(token, storeId, productId, variantId);
  }

  async updateVariantImages(
    token: string,
    storeId: string,
    productId: string,
    variantId: string,
    data: { add?: string[]; remove?: string[] },
  ): Promise<{ images: any[] }> {
    return this.repository.updateVariantImages(token, storeId, productId, variantId, data);
  }

  async health(): Promise<{ status: string; medusaUrl: string }> {
    return this.repository.health();
  }
}
