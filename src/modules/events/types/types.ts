import { EventType, OutboxEvents as PrismaOutboxEvent } from '@prisma/client';

export type OutboxEvent = Omit<PrismaOutboxEvent, 'eventType'> & {
  eventType: EventType;
};

export type BaseOrderEventData = {
  orderId: string;
  amount: number;
};

export type CreateOutboxEventData = {
  type: EventType;
  payload: BaseOrderEventData;
};

export type CreateProcessedEventData = {
  eventId: string;
  eventType: string;
};
