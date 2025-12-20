import type { ProcessedEvents } from '@prisma/client';
import { PrismaTransaction } from 'src/shared';
import { CreateProcessedEventData } from '../types/types';

export abstract class ProcessedEventsRepository {
  abstract markAsProcessed(
    data: CreateProcessedEventData,
    tx?: PrismaTransaction,
  ): Promise<ProcessedEvents>;

  abstract findById(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<ProcessedEvents | null>;

  abstract count(): Promise<number>;

  abstract findAll(): Promise<ProcessedEvents[]>;

  abstract runInTransaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T>;
}
