import { Orders } from '@prisma/client';
import { CreateOrderData, OrderStatus } from '../types';
import { PrismaTransaction } from 'src/shared';

/**
 * Repository abstrato para Orders
 */
export abstract class OrdersRepository {
  /**
   * Cria um novo pedido
   * @param data - Dados do pedido
   * @param tx - Transação opcional para operações atômicas
   */
  abstract create(
    data: CreateOrderData,
    tx?: PrismaTransaction,
  ): Promise<Orders>;

  /**
   * Lista todos os pedidos
   */
  abstract findAll(): Promise<Orders[]>;

  /**
   * Busca pedido por ID
   * @param orderId - ID do pedido
   * @param tx - Transação opcional
   */
  abstract findById(
    orderId: string,
    tx?: PrismaTransaction,
  ): Promise<Orders | null>;

  /**
   * Atualiza status de um pedido
   * @param orderId - ID do pedido
   * @param status - Novo status
   * @param tx - Transação opcional para operações atômicas
   */
  abstract updateStatus(
    orderId: string,
    status: OrderStatus,
    tx?: PrismaTransaction,
  ): Promise<Orders>;

  /**
   * Conta total de pedidos
   */
  abstract count(): Promise<number>;

  /**
   * Conta pedidos por status
   */
  abstract countByStatus(status: OrderStatus): Promise<number>;
}
