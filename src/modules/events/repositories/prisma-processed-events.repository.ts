import { Injectable } from '@nestjs/common';
import { ProcessedEvents } from '@prisma/client';
import { ProcessedEventsRepository } from './processed-events.repository';
import { PrismaService, PrismaTransaction } from 'src/shared';
import { CreateProcessedEventData } from '../types/types';

/**
 * Implementação Prisma do Repository de ProcessedEvents
 * Gerencia registro de eventos processados para idempotência
 */
@Injectable()
export class PrismaProcessedEventsRepository implements ProcessedEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se um evento já foi processado
   * Retorna true se existe registro na tabela processed_events
   */
  async wasProcessed(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<boolean> {
    const client = tx || this.prisma;
    const event = await client.processedEvents.findUnique({
      where: { eventId },
    });
    return event !== null;
  }

  /**
   * Marca evento como processado
   * Cria registro na tabela processed_events
   */
  async markAsProcessed(
    data: CreateProcessedEventData,
    tx?: PrismaTransaction,
  ): Promise<ProcessedEvents> {
    const client = tx || this.prisma;
    return client.processedEvents.create({
      data: {
        eventId: data.eventId,
        eventType: data.eventType,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Busca evento processado por ID
   */
  async findById(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<ProcessedEvents | null> {
    const client = tx || this.prisma;
    return client.processedEvents.findUnique({
      where: { eventId },
    });
  }

  /**
   * Conta total de eventos processados
   */
  async count(): Promise<number> {
    return this.prisma.processedEvents.count();
  }

  /**
   * Lista todos os eventos processados
   */
  async findAll(): Promise<ProcessedEvents[]> {
    return this.prisma.processedEvents.findMany({
      orderBy: { processedAt: 'desc' },
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
