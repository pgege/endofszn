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
    const { vendor } = await this.vendorService.getMe(token);
    return { vendor };
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

  @Post('stores/:storeId/products/:productId/variants')
  async createVariants(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.createVariants(token, storeId, productId, body);
  }

  @Delete('stores/:storeId/products/:productId/variants')
  async deleteVariants(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.deleteVariants(token, storeId, productId, body);
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

  @Put('stores/:storeId/products/:productId/variants/:variantId')
  async updateVariant(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.updateVariant(token, storeId, productId, variantId, body);
  }

  @Get('stores/:storeId/categories')
  async getCategories(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.getCategories(token, storeId);
  }

  @Post('stores/:storeId/categories')
  async createCategory(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.createCategory(token, storeId, body);
  }

  @Get('stores/:storeId/categories/:categoryId')
  async getCategory(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('categoryId') categoryId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.getCategory(token, storeId, categoryId);
  }

  @Put('stores/:storeId/categories/:categoryId')
  async updateCategory(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('categoryId') categoryId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.updateCategory(token, storeId, categoryId, body);
  }

  @Delete('stores/:storeId/categories/:categoryId')
  async deleteCategory(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('categoryId') categoryId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    await this.medusaService.deleteCategory(token, storeId, categoryId);
    return { success: true };
  }

  @Put('stores/:storeId/products/:productId/options/:optionId')
  async updateProductOption(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Param('productId') productId: string,
    @Param('optionId') optionId: string,
    @Body() body: any,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.updateProductOption(token, storeId, productId, optionId, body);
  }

  @Get('stores/:storeId/uncategorized-products')
  async getUncategorizedProducts(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.getUncategorizedProducts(token, storeId);
  }

  @Post('stores/:storeId/bulk-categorize')
  async bulkCategorize(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Body() body: { assignments: Array<{ product_id: string; category_ids: string[] }> },
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.bulkCategorize(token, storeId, body);
  }

  @Get('stores/:storeId/categories/templates')
  async getCategoryTemplates(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.getCategoryTemplates(token, storeId);
  }

  @Post('stores/:storeId/categories/apply-template')
  async applyCategoryTemplate(
    @AuthToken() token: string | undefined,
    @Param('storeId') storeId: string,
    @Body() body: { template_id: string },
  ) {
    if (!token) {
      throw ApiException.unauthorized('Not authenticated');
    }
    return this.medusaService.applyCategoryTemplate(token, storeId, body);
  }
}
