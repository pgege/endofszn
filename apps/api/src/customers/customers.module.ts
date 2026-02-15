import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { MedusaModule } from '../medusa/medusa.module';

@Module({
  imports: [MedusaModule],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
