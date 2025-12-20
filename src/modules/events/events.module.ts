import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from 'src/shared';
import { BrokerModule } from 'src/shared/';
import {
  OutboxEventsRepository,
  ProcessedEventsRepository,
  PrismaOutboxEventsRepository,
  PrismaProcessedEventsRepository,
} from './repositories';
import { OutboxRelayWorker } from './services';

@Module({
  imports: [DatabaseModule, BrokerModule, ScheduleModule.forRoot()],
  providers: [
    {
      provide: OutboxEventsRepository,
      useClass: PrismaOutboxEventsRepository,
    },
    {
      provide: ProcessedEventsRepository,
      useClass: PrismaProcessedEventsRepository,
    },
    OutboxRelayWorker,
  ],
  exports: [
    OutboxEventsRepository,
    ProcessedEventsRepository,
    OutboxRelayWorker,
  ],
})
export class EventsModule {}
