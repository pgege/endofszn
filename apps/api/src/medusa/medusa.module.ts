import { Module } from '@nestjs/common';
import { MedusaController } from './medusa.controller';
import { MedusaService } from './medusa.service';

@Module({
  controllers: [MedusaController],
  providers: [MedusaService],
  exports: [MedusaService],
})
export class MedusaModule {}
