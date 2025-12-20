import { Module } from '@nestjs/common';
import { OrdersModule } from './modules/orders/orders.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { EventsModule } from './modules/events/events.module';
import { DatabaseModule } from './shared/infra/database/database.module';
import { BrokerModule } from './shared/infra/broker/broker.module';

@Module({
  imports: [
    DatabaseModule,
    BrokerModule,
    EventsModule,
    OrdersModule,
    InvoicesModule,
  ],
})
export class AppModule {}
