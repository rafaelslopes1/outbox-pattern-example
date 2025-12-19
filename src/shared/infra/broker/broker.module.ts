import { Global, Module } from '@nestjs/common';
import { BrokerService } from './event-emitter';

@Global()
@Module({
  providers: [BrokerService],
  exports: [BrokerService],
})
export class BrokerModule {}
