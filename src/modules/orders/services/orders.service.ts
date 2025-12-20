import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateOrderData, Order, PayOrderResult } from '../types';
import { UnitOfWork } from 'src/shared';
import { OrdersRepository } from '../repositories';
import { OutboxEventsRepository } from 'src/modules';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly outboxRepository: OutboxEventsRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async createOrder(params: CreateOrderData): Promise<Order> {
    const order = await this.ordersRepository.create(params);
    this.logger.log(`📝 Pedido ${order.id} criado`);
    return order;
  }

  async listOrders(): Promise<Order[]> {
    return this.ordersRepository.findAll();
  }

  async getOrder(orderId: string): Promise<Order> {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    return order;
  }

  async payOrder(orderId: string): Promise<PayOrderResult> {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    if (order.status === 'PAID') {
      throw new BadRequestException(`Pedido ${orderId} já foi pago`);
    }

    const result = await this.unitOfWork.transaction(async (tx) => {
      const updatedOrder = await this.ordersRepository.updateStatus(
        orderId,
        'PAID',
        tx,
      );

      const event = await this.outboxRepository.addEvent(
        {
          type: 'ORDER_PAID',
          payload: {
            orderId: updatedOrder.id,
            amount: updatedOrder.amount,
          },
        },
        tx,
      );

      return { order: updatedOrder, event };
    });

    this.logger.log(`💳 Pedido ${orderId} marcado como PAID`);

    return result;
  }
}
