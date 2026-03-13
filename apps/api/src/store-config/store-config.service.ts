import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreConfigService {
  private readonly logger = new Logger(StoreConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(storeId: string) {
    let config = await this.prisma.storeConfig.findUnique({
      where: { storeId },
    });

    if (!config) {
      config = await this.prisma.storeConfig.create({
        data: { storeId },
      });
      this.logger.log(`Created StoreConfig for store ${storeId}`);
    }

    return config;
  }

  async findByStoreId(storeId: string) {
    return this.prisma.storeConfig.findUnique({
      where: { storeId },
    });
  }

  async updateSandboxId(storeId: string, sandboxId: string) {
    return this.prisma.storeConfig.update({
      where: { storeId },
      data: { sandboxId },
    });
  }
}
