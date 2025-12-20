import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxEventsRepository } from '../repositories';
import { OutboxEvent } from '../types';
import { BrokerService } from 'src/shared';

/**
 * Outbox Relay Worker
 * Responsável por publicar eventos da tabela outbox_events para o broker
 *
 * Implementa o Transactional Outbox Pattern:
 * 1. Busca eventos não publicados da outbox
 * 2. Publica no broker (BrokerService com suporte a simulação de falhas)
 * 3. Marca como publicado no banco
 * 4. Em caso de falha, incrementa contador de falhas e registra erro
 */
@Injectable()
export class OutboxRelayWorker implements OnModuleInit {
  private readonly logger = new Logger(OutboxRelayWorker.name);
  private isProcessing = false;

  // Configurações
  private readonly BATCH_SIZE = 10;
  private readonly MAX_RETRIES = 5;

  constructor(
    private readonly outboxRepository: OutboxEventsRepository,
    private readonly brokerService: BrokerService,
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Outbox Relay Worker inicializado');
    this.logger.log('⏰ Polling configurado para executar a cada 5 segundos');
  }

  /**
   * Job CRON - Executa a cada 5 segundos
   * Processa eventos pendentes da outbox
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleOutboxEvents() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      await this.processUnpublishedEvents();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Erro no processamento do outbox: ${errorMessage}`,
        errorStack,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa eventos não publicados em lote
   */
  private async processUnpublishedEvents(): Promise<void> {
    const events = await this.outboxRepository.findUnpublished(
      this.MAX_RETRIES,
    );

    if (events.length === 0) {
      return;
    }

    this.logger.log(
      `📬 Processando ${events.length} eventos pendentes na outbox`,
    );

    const batch = events.slice(0, this.BATCH_SIZE);

    for (const event of batch) {
      await this.publishEvent(event);
    }
  }

  private async publishEvent(event: OutboxEvent): Promise<void> {
    try {
      await this.brokerService.publish({
        eventId: event.eventId,
        eventType: event.eventType,
        orderId: event.orderId,
        amount: event.amount,
        occurredAt: event.occurredAt,
      });

      await this.outboxRepository.markAsPublished(event.eventId);

      this.logger.log(
        `✅ Evento ${event.eventId} (${event.eventType}) publicado com sucesso`,
      );
      return;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `❌ Falha ao publicar evento ${event.eventId}: ${errorMessage}`,
      );

      await this.outboxRepository.incrementFailureCount(
        event.eventId,
        errorMessage,
      );

      if (event.failureCount + 1 >= this.MAX_RETRIES) {
        this.logger.error(
          `⚠️ Evento ${event.eventId} atingiu o máximo de tentativas (${this.MAX_RETRIES}). Será ignorado em futuras execuções.`,
        );
      }
    }
  }

  /**
   * Retorna estatísticas do relay
   */
  async getStats() {
    const unpublishedCount = await this.outboxRepository.countUnpublished();

    return {
      unpublishedCount,
    };
  }
}
