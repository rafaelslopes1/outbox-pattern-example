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

  /**
   * Subscreve aos eventos do broker quando o módulo inicializa
   */
  onModuleInit() {
    this.logger.log('📬 InvoicesService subscrito ao evento ORDER_PAID');
    this.broker.subscribe('ORDER_PAID', (event) => {
      void this.handleOrderPaid(event);
    });
  }

  /**
   * Handler idempotente para evento OrderPaid
   *
   * Fluxo:
   * 1. Tenta marcar evento como processado (PK violation = já processado)
   * 2. Se conseguiu marcar, cria invoice
   * 3. Se falhar ao marcar como processado, verifica se foi por PK violation
   *    - Se sim, ignora (já processado)
   *    - Se não, propaga erro
   */
  private async handleOrderPaid(event: OrderPaidEvent) {
    const { eventId, orderId, amount, eventType } = event;

    try {
      this.logger.log(
        `🔔 Recebido evento OrderPaid: ${eventId} (orderId: ${orderId}, amount: ${amount})`,
      );

      const result = await this.unitOfWork.transaction(async (tx) => {
        const processedEvent =
          await this.processedEventsRepository.markAsProcessed(
            { eventId, eventType }, // eventId é PK → garante idempotência
            tx,
          );

        // Só cria invoice se conseguiu marcar como processado
        const invoice = await this.invoicesRepository.create({
          orderId,
          amount,
          issuedAt: new Date(),
        });

        return { invoice, processedEvent };
      });

      this.logger.log(
        `📄 Invoice ${result.invoice.id} criada para order ${orderId}`,
      );

      this.logger.log(`✅ Evento ${eventId} processado e marcado com sucesso`);
    } catch (error) {
      // Erro P2002 = Unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === this.UNIQUE_VIOLATION_CODE
      ) {
        const target = (error.meta?.target as string[]) || [];

        if (target.includes('eventId')) {
          this.logger.log(
            `⏭️ Evento ${eventId} já processado (PK violation em processed_events).`,
          );
        } else if (target.includes('orderId')) {
          this.logger.log(
            `⏭️ Invoice para order ${orderId} já existe (UNIQUE violation).`,
          );
        } else {
          this.logger.log(
            `⏭️ Constraint violation detectada: ${JSON.stringify(target)}. Ignorando.`,
          );
        }
        return;
      }

      // Erros reais (não relacionados a idempotência) devem ser propagados
      this.logger.error(
        `❌ Erro ao processar evento ${eventId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  /**
   * Lista todas as invoices
   */
  async listInvoices() {
    return this.invoicesRepository.findAll();
  }

  /**
   * Busca invoice por ID
   */
  async getInvoice(invoiceId: string) {
    return this.invoicesRepository.findById(invoiceId);
  }

  /**
   * Busca invoice por orderId
   */
  async getInvoiceByOrderId(orderId: string) {
    return this.invoicesRepository.findByOrderId(orderId);
  }

  /**
   * Retorna estatísticas de processamento
   */
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
