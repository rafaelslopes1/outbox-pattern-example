import { Module } from '@nestjs/common';
import { OrdersController } from './controllers';
import { OrdersService } from './services';
import { OrdersRepository, PrismaOrdersRepository } from './repositories';
import { EventsModule } from '../events';

@Module({
  imports: [EventsModule],
  controllers: [OrdersController],
  providers: [
    {
      provide: OrdersRepository,
      useClass: PrismaOrdersRepository,
    },
    OrdersService,
  ],
})
export class OrdersModule {}
