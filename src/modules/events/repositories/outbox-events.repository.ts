import type { OutboxEvents, EventType } from '@prisma/client';
import { PrismaTransaction } from 'src/shared';
import { CreateOutboxEventData } from '../types/types';

export abstract class OutboxEventsRepository {
  abstract addEvent(
    data: CreateOutboxEventData,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents>;

  abstract findUnpublished(maxRetries: number): Promise<OutboxEvents[]>;

  abstract markAsPublished(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents>;

  abstract incrementFailureCount(
    eventId: string,
    error: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents>;

  abstract findById(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents | null>;

  abstract countUnpublished(): Promise<number>;

  abstract countByType(eventType: EventType): Promise<number>;

  abstract runInTransaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T>;
}
