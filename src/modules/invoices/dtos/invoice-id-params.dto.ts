import { IsUUID } from 'class-validator';

export class InvoiceIdParamsDTO {
  @IsUUID('4', { message: 'ID da invoice deve ser um UUID válido' })
  id: string;
}
