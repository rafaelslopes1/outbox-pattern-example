import type { OutboxEvents, EventType } from '@prisma/client';
import { PrismaTransaction } from 'src/shared';
import { CreateOutboxEventData } from '../types/types';

/**
 * Repository abstrato para OutboxEvents
 * Define contrato para persistência de eventos na Outbox
 */
export abstract class OutboxEventsRepository {
  /**
   * Adiciona um novo evento na outbox
   * @param eventType - Tipo do evento
   * @param data - Dados do evento
   * @param tx - Transação opcional
   */
  abstract addEvent(
    data: CreateOutboxEventData,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents>;

  /**
   * Busca eventos não publicados (publishedAt = null)
   * Usado pelo Outbox Relay Worker para processar eventos pendentes
   * @param maxRetries - Número máximo de tentativas antes de desistir
   */
  abstract findUnpublished(maxRetries: number): Promise<OutboxEvents[]>;

  /**
   * Marca um evento como publicado
   * @param eventId - ID do evento
   * @param tx - Transação opcional
   */
  abstract markAsPublished(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents>;

  /**
   * Incrementa contador de falhas e atualiza erro
   * @param eventId - ID do evento
   * @param error - Mensagem de erro
   * @param tx - Transação opcional
   */
  abstract incrementFailureCount(
    eventId: string,
    error: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents>;

  /**
   * Busca evento por ID
   * @param eventId - ID do evento
   * @param tx - Transação opcional
   */
  abstract findById(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents | null>;

  /**
   * Conta eventos não publicados
   */
  abstract countUnpublished(): Promise<number>;

  /**
   * Conta eventos por tipo
   * @param eventType - Tipo do evento
   */
  abstract countByType(eventType: EventType): Promise<number>;

  /**
   * Executa função dentro de uma transação
   */
  abstract runInTransaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T>;
}
