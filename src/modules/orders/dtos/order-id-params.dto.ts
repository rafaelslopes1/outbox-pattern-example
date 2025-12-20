import { IsUUID } from 'class-validator';

export class OrderIdParamsDTO {
  @IsUUID('4', { message: 'ID do pedido deve ser um UUID válido' })
  id: string;
}
