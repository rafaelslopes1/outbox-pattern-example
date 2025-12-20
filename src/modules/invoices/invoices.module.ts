import { Module } from '@nestjs/common';
import { InvoicesController } from './controllers';
import { InvoicesService } from './services';
import { InvoicesRepository, PrismaInvoicesRepository } from './repositories';
import { EventsModule } from '../events';

@Module({
  imports: [EventsModule],
  controllers: [InvoicesController],
  providers: [
    {
      provide: InvoicesRepository,
      useClass: PrismaInvoicesRepository,
    },
    InvoicesService,
  ],
})
export class InvoicesModule {}
