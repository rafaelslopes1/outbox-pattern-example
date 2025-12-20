import { Injectable } from '@nestjs/common';
import { Orders } from '@prisma/client';
import { OrdersRepository } from './orders.repository';
import { OrderStatus, CreateOrderData } from '../types';
import { PrismaService, PrismaTransaction } from 'src/shared';

/**
 * Implementação Prisma do Repository de Orders
 * Usa PostgreSQL via Prisma ORM
 */
@Injectable()
export class PrismaOrdersRepository implements OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo pedido
   * Aceita transação opcional para operações atômicas
   */
  async create(data: CreateOrderData, tx?: PrismaTransaction): Promise<Orders> {
    const client = tx || this.prisma;
    return client.orders.create({
      data: {
        amount: data.amount,
        status: data.status ?? 'PENDING',
      },
    });
  }

  /**
   * Lista todos os pedidos
   */
  async findAll(): Promise<Orders[]> {
    return this.prisma.orders.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca pedido por ID
   * Aceita transação opcional para leituras consistentes
   */
  async findById(
    orderId: string,
    tx?: PrismaTransaction,
  ): Promise<Orders | null> {
    const client = tx || this.prisma;
    return client.orders.findUnique({
      where: { id: orderId },
    });
  }

  /**
   * Atualiza status de um pedido
   * Aceita transação opcional para operações atômicas
   */
  async updateStatus(
    orderId: string,
    status: OrderStatus,
    tx?: PrismaTransaction,
  ): Promise<Orders> {
    const client = tx || this.prisma;
    return client.orders.update({
      where: { id: orderId },
      data: { status },
    });
  }

  /**
   * Conta total de pedidos
   */
  async count(): Promise<number> {
    return this.prisma.orders.count();
  }

  /**
   * Conta pedidos por status
   */
  async countByStatus(status: OrderStatus): Promise<number> {
    return this.prisma.orders.count({
      where: { status },
    });
  }
}
