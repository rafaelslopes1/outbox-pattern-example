import { Exclude, Expose, Type } from 'class-transformer';
import { OrderResponseDTO } from './order-response.dto';
import { OutboxEventResponseDTO } from '../../events';
import type { PayOrderResult } from '../types';

@Exclude()
export class PayOrderResponseDTO {
  @Expose()
  @Type(() => OrderResponseDTO)
  order: OrderResponseDTO;

  @Expose()
  @Type(() => OutboxEventResponseDTO)
  event: OutboxEventResponseDTO;

  constructor(data: PayOrderResult) {
    this.order = Object.assign(new OrderResponseDTO(), data.order);
    this.event = Object.assign(new OutboxEventResponseDTO(), data.event);
  }
}
