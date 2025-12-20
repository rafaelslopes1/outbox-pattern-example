import type { CreateInvoiceData, Invoice } from '../types';

/**
 * Repository abstrato para Invoices
 */
export abstract class InvoicesRepository {
  /**
   * Cria uma nova invoice
   */
  abstract create(data: CreateInvoiceData): Promise<Invoice>;

  /**
   * Lista todas as invoices
   */
  abstract findAll(): Promise<Invoice[]>;

  /**
   * Busca invoice por ID
   */
  abstract findById(invoiceId: string): Promise<Invoice | null>;

  /**
   * Busca invoice por orderId
   */
  abstract findByOrderId(orderId: string): Promise<Invoice | null>;

  /**
   * Conta total de invoices
   */
  abstract count(): Promise<number>;
}
