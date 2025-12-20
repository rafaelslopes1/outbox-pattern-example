import {
  Controller,
  Param,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from '../services';
import {
  CreateOrderParamsDTO,
  OrderResponseDTO,
  PayOrderResponseDTO,
  OrderIdParamsDTO,
} from '../dtos';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Body() body: CreateOrderParamsDTO,
  ): Promise<OrderResponseDTO> {
    const order = await this.ordersService.createOrder(body);
    return Object.assign(new OrderResponseDTO(), order);
  }

  @Get()
  async listOrders(): Promise<OrderResponseDTO[]> {
    const orders = await this.ordersService.listOrders();
    return orders.map((order) => Object.assign(new OrderResponseDTO(), order));
  }

  @Get('/:id')
  async getOrder(@Param() params: OrderIdParamsDTO): Promise<OrderResponseDTO> {
    const order = await this.ordersService.getOrder(params.id);
    return Object.assign(new OrderResponseDTO(), order);
  }

  @Post('/:id/pay')
  @HttpCode(HttpStatus.OK)
  async payOrder(
    @Param() params: OrderIdParamsDTO,
  ): Promise<PayOrderResponseDTO> {
    const result = await this.ordersService.payOrder(params.id);
    return new PayOrderResponseDTO(result);
  }
}
