import { Module } from '@nestjs/common';
import { MedusaRepository } from './medusa.repository';
import { MedusaService } from './medusa.service';

@Module({
  providers: [MedusaRepository, MedusaService],
  exports: [MedusaService],
})
export class MedusaModule {}
