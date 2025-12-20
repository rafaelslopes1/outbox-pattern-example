import { Controller, Get, Param } from '@nestjs/common';
import { InvoicesService } from '../services';
import {
  InvoiceResponseDTO,
  InvoiceStatsResponseDTO,
  InvoiceIdParamsDTO,
  OrderIdParamsDTO,
} from '../dtos';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async listInvoices(): Promise<InvoiceResponseDTO[]> {
    const invoices = await this.invoicesService.listInvoices();
    return invoices.map((invoice) =>
      Object.assign(new InvoiceResponseDTO(), invoice),
    );
  }

  @Get('stats')
  async getStats(): Promise<InvoiceStatsResponseDTO> {
    const stats = await this.invoicesService.getStats();
    return Object.assign(new InvoiceStatsResponseDTO(), stats);
  }

  @Get(':id')
  async getInvoice(
    @Param() params: InvoiceIdParamsDTO,
  ): Promise<InvoiceResponseDTO | null> {
    const invoice = await this.invoicesService.getInvoice(params.id);
    return invoice ? Object.assign(new InvoiceResponseDTO(), invoice) : null;
  }

  @Get('order/:orderId')
  async getInvoiceByOrderId(
    @Param() params: OrderIdParamsDTO,
  ): Promise<InvoiceResponseDTO | null> {
    const invoice = await this.invoicesService.getInvoiceByOrderId(
      params.orderId,
    );
    return invoice ? Object.assign(new InvoiceResponseDTO(), invoice) : null;
  }
}
