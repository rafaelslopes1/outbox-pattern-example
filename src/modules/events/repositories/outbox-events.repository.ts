import type { OutboxEvents, EventType } from '@prisma/client';
import { PrismaTransaction } from 'src/shared';
import { CreateOutboxEventData } from '../types/types';

export abstract class OutboxEventsRepository {
  abstract addEvent(
    data: CreateOutboxEventData,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents>;

  /**
   * Busca eventos não publicados (publishedAt = null)
   * @param maxRetries Número máximo de tentativas
   * @param limit Limite de eventos a buscar (para evitar sobrecarga de memória)
   */
  abstract findUnpublished(
    maxRetries: number,
    limit?: number,
  ): Promise<OutboxEvents[]>;

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
