import { Controller, Get, Param, Query } from '@nestjs/common';
import { MedusaService } from './medusa.service';

@Controller('api/medusa')
export class MedusaController {
  constructor(private readonly medusaService: MedusaService) {}

  @Get('health')
  async health() {
    return this.medusaService.health();
  }

  @Get('products')
  async getProducts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.medusaService.getProducts(
      limit ? parseInt(limit, 10) : 10,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.medusaService.getProduct(id);
  }

  @Get('regions')
  async getRegions() {
    return this.medusaService.getRegions();
  }

  @Get('collections')
  async getCollections() {
    return this.medusaService.getCollections();
  }
}
