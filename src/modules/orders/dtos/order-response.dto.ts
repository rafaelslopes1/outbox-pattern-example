import { Exclude, Expose, Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { Order } from '../types';

@Exclude()
export class OrderResponseDTO implements Order {
  @Expose()
  id: string;

  @Expose()
  amount: number;

  @Expose()
  status: OrderStatus;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
