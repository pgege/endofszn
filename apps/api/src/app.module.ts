import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { EventsModule } from './events/events.module';
import { MedusaModule } from './medusa/medusa.module';

@Module({
  imports: [PrismaModule, RedisModule, UserModule, EventsModule, MedusaModule],
  controllers: [AppController],
})
export class AppModule {}
