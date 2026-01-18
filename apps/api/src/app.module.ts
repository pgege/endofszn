import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, CacheModule, UserModule],
  controllers: [AppController],
})
export class AppModule {}
