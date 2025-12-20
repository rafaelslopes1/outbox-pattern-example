import {
  OrderStatus as PrismaOrderStatus,
  Orders as PrismaOrder,
} from '@prisma/client';
import { OutboxEvent } from 'src/modules/events';

export type OrderStatus = PrismaOrderStatus;

export type OutboxOrderEvent = OutboxEvent & {
  orderId: string;
  amount: number;
};

export type Order = Omit<PrismaOrder, 'status'> & {
  status: OrderStatus;
};

export type CreateOrderData = {
  amount: number;
  status?: OrderStatus;
};

export type UpdateOrderStatusData = {
  status: OrderStatus;
};

export type PayOrderResult = {
  order: Order;
  event: OutboxEvent;
};
