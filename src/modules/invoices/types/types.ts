import type { Invoices } from '@prisma/client';
import type { BrokerEvent } from 'src/shared';

export type Invoice = Invoices;

export type OrderPaidEvent = BrokerEvent;

export type CreateInvoiceData = {
  orderId: string;
  amount: number;
  issuedAt?: Date;
};
