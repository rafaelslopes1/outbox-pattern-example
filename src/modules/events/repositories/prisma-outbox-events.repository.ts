import { Injectable } from '@nestjs/common';
import { OutboxEvents, EventType } from '@prisma/client';
import { OutboxEventsRepository } from './outbox-events.repository';
import { PrismaService, PrismaTransaction } from 'src/shared';
import { CreateOutboxEventData } from '../types/types';

/**
 * Implementação Prisma do Repository de OutboxEvents
 * Gerencia eventos na tabela outbox_events
 */
@Injectable()
export class PrismaOutboxEventsRepository implements OutboxEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adiciona um novo evento na outbox
   */
  async addEvent(
    data: CreateOutboxEventData,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents> {
    const client = tx || this.prisma;
    return client.outboxEvents.create({
      data: {
        eventType: data.type,
        ...data.payload,
      },
    });
  }

  /**
   * Busca eventos não publicados (publishedAt = null)
   * @param maxRetries Número máximo de tentativas
   * @param limit Limite de eventos a buscar (para evitar sobrecarga de memória)
   */
  async findUnpublished(
    maxRetries: number,
    limit?: number,
  ): Promise<OutboxEvents[]> {
    return this.prisma.outboxEvents.findMany({
      where: { publishedAt: null, failureCount: { lt: maxRetries } },
      orderBy: { occurredAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Marca um evento como publicado
   * Define publishedAt com a data/hora atual
   */
  async markAsPublished(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents> {
    const client = tx || this.prisma;
    return client.outboxEvents.update({
      where: { eventId },
      data: { publishedAt: new Date() },
    });
  }

  /**
   * Incrementa contador de falhas e registra erro
   * Usado quando a publicação do evento falha
   */
  async incrementFailureCount(
    eventId: string,
    error: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents> {
    const client = tx || this.prisma;
    return client.outboxEvents.update({
      where: { eventId },
      data: {
        failureCount: { increment: 1 },
        lastError: error,
      },
    });
  }

  /**
   * Busca evento por ID
   */
  async findById(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<OutboxEvents | null> {
    const client = tx || this.prisma;
    return client.outboxEvents.findUnique({
      where: { eventId },
    });
  }

  /**
   * Conta eventos não publicados
   */
  async countUnpublished(): Promise<number> {
    return this.prisma.outboxEvents.count({
      where: { publishedAt: null },
    });
  }

  /**
   * Conta eventos por tipo
   */
  async countByType(eventType: EventType): Promise<number> {
    return this.prisma.outboxEvents.count({
      where: { eventType },
    });
  }

  /**
   * Executa função dentro de uma transação
   */
  async runInTransaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
