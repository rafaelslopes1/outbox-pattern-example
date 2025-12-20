import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BrokerService } from 'src/shared/infra/broker/event-emitter';
import { InvoicesRepository } from '../repositories';
import { ProcessedEventsRepository } from 'src/modules/events';
import { UnitOfWork } from 'src/shared';
import { Prisma } from '@prisma/client';
import { InvoiceStatsResponseDTO } from '../dtos';
import { OrderPaidEvent } from '../types';

@Injectable()
export class InvoicesService implements OnModuleInit {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly UNIQUE_VIOLATION_CODE = 'P2002';

  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly processedEventsRepository: ProcessedEventsRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly broker: BrokerService,
  ) {}

  onModuleInit() {
    this.logger.log('📬 InvoicesService subscrito ao evento ORDER_PAID');
    this.broker.subscribe('ORDER_PAID', (event) => {
      void this.handleOrderPaid(event);
    });
  }

  private async handleOrderPaid(event: OrderPaidEvent) {
    const { eventId, orderId, amount, eventType } = event;

    try {
      this.logger.log(
        `🔔 Processando evento ${eventId} para pedido ${orderId}`,
      );

      const result = await this.unitOfWork.transaction(async (tx) => {
        await this.processedEventsRepository.markAsProcessed(
          { eventId, eventType },
          tx,
        );

        const invoice = await this.invoicesRepository.create({
          orderId,
          amount,
          issuedAt: new Date(),
        });

        return invoice;
      });

      this.logger.log(`✅ Invoice ${result.id} criada para pedido ${orderId}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === this.UNIQUE_VIOLATION_CODE
      ) {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('eventId')) {
          this.logger.log(`⏭️ Evento ${eventId} já processado (idempotência)`);
        } else if (target.includes('orderId')) {
          this.logger.log(`⏭️ Invoice para pedido ${orderId} já existe`);
        }
        return;
      }

      this.logger.error(
        `❌ Erro ao processar evento ${eventId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  async listInvoices() {
    return this.invoicesRepository.findAll();
  }

  async getInvoice(invoiceId: string) {
    return this.invoicesRepository.findById(invoiceId);
  }

  async getInvoiceByOrderId(orderId: string) {
    return this.invoicesRepository.findByOrderId(orderId);
  }

  async getStats(): Promise<InvoiceStatsResponseDTO> {
    const [totalInvoices, totalProcessedEvents] = await Promise.all([
      this.invoicesRepository.count(),
      this.processedEventsRepository.count(),
    ]);

    return {
      totalInvoices,
      totalProcessedEvents,
    };
  }
}
