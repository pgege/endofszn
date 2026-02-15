import { Module, Global } from '@nestjs/common';
import { PubSubService } from './pubsub.service';
import { RedisPubSubService } from './redis-pubsub.service';

@Global()
@Module({
  providers: [
    {
      provide: PubSubService,
      useClass: RedisPubSubService,
    },
  ],
  exports: [PubSubService],
})
export class PubSubModule {}
