import type { ProcessedEvents } from '@prisma/client';
import { PrismaTransaction } from 'src/shared';
import { CreateProcessedEventData } from '../types/types';

/**
 * Repository abstrato para ProcessedEvents
 * Define contrato para persistência de eventos processados (idempotência)
 */
export abstract class ProcessedEventsRepository {
  /**
   * Verifica se um evento já foi processado
   * @param eventId - ID do evento
   * @param tx - Transação opcional
   */
  abstract wasProcessed(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<boolean>;

  /**
   * Marca evento como processado
   * @param data - Dados do evento processado
   * @param tx - Transação opcional
   */
  abstract markAsProcessed(
    data: CreateProcessedEventData,
    tx?: PrismaTransaction,
  ): Promise<ProcessedEvents>;

  /**
   * Busca evento processado por ID
   * @param eventId - ID do evento
   * @param tx - Transação opcional
   */
  abstract findById(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<ProcessedEvents | null>;

  /**
   * Conta total de eventos processados
   */
  abstract count(): Promise<number>;

  /**
   * Lista todos os eventos processados
   */
  abstract findAll(): Promise<ProcessedEvents[]>;

  /**
   * Executa função dentro de uma transação
   */
  abstract runInTransaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T>;
}
