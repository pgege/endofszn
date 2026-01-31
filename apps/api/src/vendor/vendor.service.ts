import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';
import { ApiException, MedusaException } from '../common';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginVendorDto } from './dto/login-vendor.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

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
  isPublished: boolean;
  acceptsOrders: boolean;
}

export interface AuthResult {
  token: string;
  vendor: Vendor;
}

@Injectable()
export class VendorService {
  constructor(private readonly medusaService: MedusaService) {}

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

  async register(dto: RegisterVendorDto): Promise<AuthResult> {
    try {
      const { token: registrationToken } =
        await this.medusaService.vendorAuthRegister(dto.email, dto.password);

      const { vendor } = await this.medusaService.createVendor(
        registrationToken,
        {
          email: dto.email,
          first_name: dto.firstName,
          last_name: dto.lastName,
        },
      );

      const { token } = await this.medusaService.vendorAuthLogin(
        dto.email,
        dto.password,
      );

      return {
        token,
        vendor: {
          id: vendor.id,
          email: vendor.email,
          firstName: vendor.first_name,
          lastName: vendor.last_name,
        },
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        if (error.message?.includes('already exists')) {
          throw ApiException.conflict(
            'An account with this email already exists',
          );
        }
        throw error;
      }
      throw ApiException.badRequest('Registration failed');
    }
  }

  async login(dto: LoginVendorDto): Promise<AuthResult> {
    let token: string;

    try {
      const result = await this.medusaService.vendorAuthLogin(
        dto.email,
        dto.password,
      );
      token = result.token;
    } catch {
      throw ApiException.unauthorized('Invalid email or password');
    }

    try {
      const { vendor } = await this.medusaService.vendorMe(token);

      return {
        token,
        vendor: {
          id: vendor.id,
          email: vendor.email,
          firstName: vendor.first_name,
          lastName: vendor.last_name,
        },
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to retrieve vendor profile');
    }
  }

  async getMe(token: string): Promise<{ vendor: Vendor }> {
    try {
      const { vendor } = await this.medusaService.vendorMe(token);

      return {
        vendor: {
          id: vendor.id,
          email: vendor.email,
          firstName: vendor.first_name,
          lastName: vendor.last_name,
        },
      };
    } catch {
      throw ApiException.unauthorized('Invalid or expired session');
    }
  }

  async getStores(token: string): Promise<Store[]> {
    try {
      const { stores } = await this.medusaService.getStores(token);
      return stores.map((store) => this.transformStore(store));
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to retrieve stores');
    }
  }

  async createStore(token: string, dto: CreateStoreDto): Promise<Store> {
    try {
      const { store, profile } = await this.medusaService.createStore(token, {
        name: dto.name,
        description: dto.description,
        tagline: dto.tagline,
        logo_url: dto.logo_url,
        banner_url: dto.banner_url,
        contact_email: dto.contact_email,
        contact_phone: dto.contact_phone,
        address: dto.address,
        social_links: dto.social_links,
        business_info: dto.business_info,
        default_currency_code: dto.default_currency_code,
      });

      return {
        id: store.id,
        name: store.name,
        profile: this.transformProfile(profile),
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to create store');
    }
  }

  async getStore(token: string, storeId: string): Promise<Store> {
    try {
      const { store, profile } = await this.medusaService.getStore(
        token,
        storeId,
      );

      return {
        id: store.id,
        name: store.name,
        profile: this.transformProfile(profile),
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to retrieve store');
    }
  }

  async updateStore(
    token: string,
    storeId: string,
    dto: UpdateStoreDto,
  ): Promise<Store> {
    try {
      const { store, profile } = await this.medusaService.updateStore(
        token,
        storeId,
        dto,
      );

      return {
        id: store.id,
        name: store.name,
        profile: this.transformProfile(profile),
      };
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to update store');
    }
  }

  async deleteStore(token: string, storeId: string): Promise<void> {
    try {
      await this.medusaService.deleteStore(token, storeId);
    } catch (error) {
      if (error instanceof MedusaException) {
        throw error;
      }
      throw ApiException.badRequest('Failed to delete store');
    }
  }
}
