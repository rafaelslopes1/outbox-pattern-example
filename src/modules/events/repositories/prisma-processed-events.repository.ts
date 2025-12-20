import { Injectable } from '@nestjs/common';
import { ProcessedEvents } from '@prisma/client';
import { ProcessedEventsRepository } from './processed-events.repository';
import { PrismaService, PrismaTransaction } from 'src/shared';
import { CreateProcessedEventData } from '../types/types';

@Injectable()
export class PrismaProcessedEventsRepository implements ProcessedEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(
    eventId: string,
    tx?: PrismaTransaction,
  ): Promise<ProcessedEvents | null> {
    const client = tx || this.prisma;
    return client.processedEvents.findUnique({
      where: { eventId },
    });
  }

  async count(): Promise<number> {
    return this.prisma.processedEvents.count();
  }

  async findAll(): Promise<ProcessedEvents[]> {
    return this.prisma.processedEvents.findMany({
      orderBy: { processedAt: 'desc' },
    });
  }

  async runInTransaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
