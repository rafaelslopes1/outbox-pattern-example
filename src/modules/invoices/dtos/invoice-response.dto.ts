import { Exclude, Expose, Type } from 'class-transformer';
import { Invoice } from '../types';

@Exclude()
export class InvoiceResponseDTO implements Invoice {
  @Expose()
  id: string;

  @Expose()
  orderId: string;

  @Expose()
  amount: number;

  @Expose()
  @Type(() => Date)
  issuedAt: Date;
}
