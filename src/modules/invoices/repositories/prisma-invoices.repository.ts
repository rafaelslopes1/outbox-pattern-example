import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infra/database/prisma/services/prisma.database.service';
import type { Invoices } from '@prisma/client';
import { InvoicesRepository } from './invoices.repository';
import type { CreateInvoiceData, Invoice } from '../types';

/**
 * Implementação Prisma do Repository de Invoices
 * Usa PostgreSQL via Prisma ORM
 */
@Injectable()
export class PrismaInvoicesRepository implements InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova invoice
   */
  async create(data: CreateInvoiceData): Promise<Invoice> {
    return this.prisma.invoices.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        issuedAt: data.issuedAt || new Date(),
      },
    });
  }

  /**
   * Lista todas as invoices
   */
  async findAll(): Promise<Invoices[]> {
    return this.prisma.invoices.findMany({
      orderBy: { issuedAt: 'desc' },
    });
  }

  /**
   * Busca invoice por ID
   */
  async findById(invoiceId: string): Promise<Invoices | null> {
    return this.prisma.invoices.findUnique({
      where: { id: invoiceId },
    });
  }

  /**
   * Busca invoice por orderId
   */
  async findByOrderId(orderId: string): Promise<Invoices | null> {
    return this.prisma.invoices.findUnique({
      where: { orderId },
    });
  }

  /**
   * Conta total de invoices
   */
  async count(): Promise<number> {
    return this.prisma.invoices.count();
  }
}
