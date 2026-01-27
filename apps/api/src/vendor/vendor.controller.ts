import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { VendorService } from './vendor.service';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { LoginVendorDto } from './dto/login-vendor.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import {
  AuthToken,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  ApiException,
} from '../common';
import { MedusaService } from '../medusa/medusa.service';

@Controller('api')
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly medusaService: MedusaService,
  ) {}

  @Post('vendors/register')
  async register(
    @Body() dto: RegisterVendorDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, vendor } = await this.vendorService.register(dto);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return { vendor };
  }

  @Post('auth/login')
  async login(
    @Body() dto: LoginVendorDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, vendor } = await this.vendorService.login(dto);
    res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
    return { vendor };
  }

  @Get('auth/me')
  async me(@AuthToken() token: string | undefined) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    const { vendor, stores } = await this.vendorService.getMe(token);
    return { vendor, stores };
  }

  @Post('auth/logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { success: true };
  }

  @Get('stores')
  async getStores(@AuthToken() token: string | undefined) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    const stores = await this.vendorService.getStores(token);
    return { stores };
  }

  @Post('stores')
  async createStore(
    @AuthToken() token: string | undefined,
    @Body() dto: CreateStoreDto,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    const store = await this.vendorService.createStore(token, dto);
    return { store };
  }

  @Get('stores/:id')
  async getStore(
    @AuthToken() token: string | undefined,
    @Param('id') id: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    const store = await this.vendorService.getStore(token, id);
    return { store };
  }

  @Put('stores/:id')
  async updateStore(
    @AuthToken() token: string | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    const store = await this.vendorService.updateStore(token, id, dto);
    return { store };
  }

  @Delete('stores/:id')
  async deleteStore(
    @AuthToken() token: string | undefined,
    @Param('id') id: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    await this.vendorService.deleteStore(token, id);
    return { success: true };
  }

  @Get('stores/:storeId/products')
  async getProducts(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.getProducts(token, storeId);
  }

  @Post('stores/:storeId/products')
  async createProduct(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.createProduct(token, storeId, body);
  }

  @Get('stores/:storeId/products/:productId')
  async getProduct(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.getProduct(token, storeId, productId);
  }

  @Put('stores/:storeId/products/:productId')
  async updateProduct(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.updateProduct(token, storeId, productId, body);
  }

  @Delete('stores/:storeId/products/:productId')
  async deleteProduct(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    await this.medusaService.deleteProduct(token, storeId, productId);
    return { success: true };
  }

  @Post('uploads')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @AuthToken() token: string | undefined,
    @UploadedFiles() files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    if (!files || files.length === 0) {
      throw ApiException.badRequest('No files provided');
    }
    return this.medusaService.uploadFiles(token, files);
  }

  @Get('stores/:storeId/products/:productId/variants/:variantId/images')
  async getVariantImages(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.getVariantImages(token, storeId, productId, variantId);
  }

  @Post('stores/:storeId/products/:productId/variants/:variantId/images')
  async updateVariantImages(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() body: { add?: string[]; remove?: string[] },
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.updateVariantImages(token, storeId, productId, variantId, body);
  }
}
