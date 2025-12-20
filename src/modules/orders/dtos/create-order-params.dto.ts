import { IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderData } from '../types';
import { OrderStatus } from '@prisma/client';

export class CreateOrderParamsDTO implements CreateOrderData {
  @IsNumber()
  @IsPositive({ message: 'O valor do pedido deve ser positivo' })
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `Status inválido. Valores permitidos são: ${Object.values(OrderStatus).join(', ')}`,
  })
  status?: OrderStatus;
}
