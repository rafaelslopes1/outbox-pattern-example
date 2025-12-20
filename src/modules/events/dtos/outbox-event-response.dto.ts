import { Exclude, Expose, Type } from 'class-transformer';
import { EventType } from '@prisma/client';
import { OutboxEvent } from '../types';

@Exclude()
export class OutboxEventResponseDTO implements OutboxEvent {
  @Expose()
  eventId: string;

  @Expose()
  eventType: EventType;

  @Expose()
  orderId: string;

  @Expose()
  amount: number;

  @Expose()
  @Type(() => Date)
  occurredAt: Date;

  @Expose()
  @Type(() => Date)
  publishedAt: Date | null;

  @Expose()
  failureCount: number;

  @Expose()
  lastError: string | null;
}
