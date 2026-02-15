import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { StoreSyncService } from '../events/store-sync.service';
import { ApiException, MedusaException } from '../common';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginVendorDto } from './dto/login-vendor.dto';

type Source = 'user' | 'agent';

export interface Vendor {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface Store {
  id: string;
  name: string;
  createdAt?: string;
  profile: StoreProfile | null;
}

export interface StoreProfile {
  id: string;
  storeId: string;
  description: string | null;
  tagline: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
  };
  socialLinks: {
    website: string | null;
    instagram: string | null;
    twitter: string | null;
    facebook: string | null;
    tiktok: string | null;
  };
  businessInfo: {
    businessType: string | null;
    taxId: string | null;
    registrationNumber: string | null;
  };
  shippingPolicy: string | null;
  returnsPolicy: string | null;
  warrantyPolicy: string | null;
  isPublished: boolean;
  acceptsOrders: boolean;
}

export interface AuthResult {
  token: string;
  vendor: Vendor;
}

@Injectable()
export class VendorService {
  constructor(
    private readonly medusaService: MedusaService,
    private readonly storeSync: StoreSyncService,
  ) {}

  private broadcastStores(vendorId: string, action: 'created' | 'updated' | 'deleted', source: Source, storeIds: string[]) {
    if (storeIds.length === 0) return;
    this.storeSync.broadcastMutation({
      vendor_id: vendorId,
      entity: 'store',
      action,
      entity_id: storeIds[0],
      entity_ids: storeIds,
      store_id: action !== 'created' ? storeIds[0] : undefined,
      timestamp: new Date().toISOString(),
      source,
    });
  }

  private transformProfile(profile: any): StoreProfile | null {
    if (!profile) return null;
    return {
      id: profile.id,
      storeId: profile.store_id,
      description: profile.description,
      tagline: profile.tagline,
      logoUrl: profile.logo_url,
      bannerUrl: profile.banner_url,
      contactEmail: profile.contact_email,
      contactPhone: profile.contact_phone,
      address: {
        street: profile.address_street,
        city: profile.address_city,
        state: profile.address_state,
        country: profile.address_country,
        postalCode: profile.address_postal_code,
      },
      socialLinks: {
        website: profile.website_url,
        instagram: profile.instagram_url,
        twitter: profile.twitter_url,
        facebook: profile.facebook_url,
        tiktok: profile.tiktok_url,
      },
      businessInfo: {
        businessType: profile.business_type,
        taxId: profile.tax_id,
        registrationNumber: profile.registration_number,
      },
      shippingPolicy: profile.shipping_policy,
      returnsPolicy: profile.returns_policy,
      warrantyPolicy: profile.warranty_policy,
      isPublished: profile.is_published,
      acceptsOrders: profile.accepts_orders,
    };
  }

  private transformStore(store: any): Store {
    return {
      id: store.id,
      name: store.name,
      createdAt: store.created_at,
      profile: this.transformProfile(store.profile),
    };
  }

  async getVendorId(token: string): Promise<string> {
    const { vendor } = await this.getMe(token);
    return vendor.id;
  }

  async register(dto: RegisterVendorDto): Promise<AuthResult> {
    try {
      const { token: registrationToken } = await this.medusaService.vendorAuthRegister(dto.email, dto.password);
      const { vendor } = await this.medusaService.createVendor(registrationToken, {
        email: dto.email,
        first_name: dto.firstName,
        last_name: dto.lastName,
      });
      const { token } = await this.medusaService.vendorAuthLogin(dto.email, dto.password);
      return {
        token,
        vendor: { id: vendor.id, email: vendor.email, firstName: vendor.first_name, lastName: vendor.last_name },
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        if (error.message?.includes('already exists')) {
          throw ApiException.conflict('An account with this email already exists');
        }
        throw error;
      }
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  async login(dto: LoginVendorDto): Promise<AuthResult> {
    let token: string;
    try {
      const result = await this.medusaService.vendorAuthLogin(dto.email, dto.password);
      token = result.token;
    } catch {
      throw ApiException.unauthorized('Invalid email or password');
    }
    try {
      const { vendor } = await this.medusaService.vendorMe(token);
      return {
        token,
        vendor: { id: vendor.id, email: vendor.email, firstName: vendor.first_name, lastName: vendor.last_name },
      };
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Failed to retrieve vendor profile');
    }
  }

  async getMe(token: string): Promise<{ vendor: Vendor }> {
    try {
      const { vendor } = await this.medusaService.vendorMe(token);
      return {
        vendor: { id: vendor.id, email: vendor.email, firstName: vendor.first_name, lastName: vendor.last_name },
      };
    } catch {
      throw ApiException.unauthorized('Invalid or expired session');
    }
  }

  async getStores(token: string, params?: { limit?: number; offset?: number; q?: string; order?: string; id?: string[] }) {
    try {
      return await this.medusaService.getStores(token, params);
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'getStores' });
    }
  }

  async createStores(token: string, vendorId: string, items: any[], source: Source) {
    try {
      const result = await this.medusaService.createStores(token, items);
      const ids = (result.stores || []).map((s: any) => s.id || s.store?.id).filter(Boolean);
      this.broadcastStores(vendorId, 'created', source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'createStores' });
    }
  }

  async updateStores(token: string, vendorId: string, updates: Array<{ id: string } & Record<string, any>>, source: Source) {
    try {
      const result = await this.medusaService.updateStores(token, updates);
      const ids = (result.stores || []).map((s: any) => s.id).filter(Boolean);
      this.broadcastStores(vendorId, 'updated', source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'updateStores' });
    }
  }

  async deleteStores(token: string, vendorId: string, ids: string[], source: Source) {
    try {
      const result = await this.medusaService.deleteStores(token, ids);
      this.broadcastStores(vendorId, 'deleted', source, ids);
      return result;
    } catch (error) {
      if (error instanceof MedusaException) throw error;
      throw ApiException.badRequest(error instanceof Error ? error.message : 'Unexpected error', { operation: 'deleteStores' });
    }
  }
}
