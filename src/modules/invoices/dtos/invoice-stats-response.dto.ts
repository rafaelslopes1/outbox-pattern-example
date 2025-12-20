import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class InvoiceStatsResponseDTO {
  @Expose()
  totalInvoices: number;

  @Expose()
  totalProcessedEvents: number;
}
