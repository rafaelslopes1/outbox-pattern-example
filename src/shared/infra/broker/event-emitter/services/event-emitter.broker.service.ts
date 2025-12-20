import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { BrokerConfig, BrokerEvent, EventType } from '../../types';

@Injectable()
export class BrokerService extends EventEmitter {
  private readonly logger = new Logger(BrokerService.name);
  private failureCount = 0;
  private config: BrokerConfig = {
    simulateFailure: false,
    failuresBeforeSuccess: 0,
  };

  constructor() {
    super();
    this.logger.log('🚀 Broker In-Memory inicializado');
  }

  async publish(event: BrokerEvent): Promise<void> {
    this.logger.log(
      `📤 Publicando evento ${event.eventType} (ID: ${event.eventId})`,
    );

    if (this.config.simulateFailure) {
      if (this.failureCount < this.config.failuresBeforeSuccess) {
        this.failureCount++;
        const error = new Error(
          `Broker simulou falha ${this.failureCount}/${this.config.failuresBeforeSuccess}`,
        );
        this.logger.error(`❌ ${error.message}`);
        throw error;
      }

      this.logger.log(
        `✅ Broker funcionando após ${this.failureCount} falhas simuladas`,
      );
      this.resetFailureSimulation(); // Resetar após ter todas as falhas simuladas
    }

    await this.delay(10); // Simula latência de rede

    this.emit(event.eventType, event);

    this.logger.log(
      `✅ Evento ${event.eventType} (ID: ${event.eventId}) publicado com sucesso`,
    );
  }

  configureFailureSimulation(failuresBeforeSuccess: number) {
    this.config.simulateFailure = failuresBeforeSuccess > 0;
    this.config.failuresBeforeSuccess = failuresBeforeSuccess;
    this.failureCount = 0;

    if (this.config.simulateFailure) {
      this.logger.warn(
        `⚠️ Simulação de falha configurada: ${failuresBeforeSuccess} falhas antes do sucesso`,
      );
    }
  }

  resetFailureSimulation() {
    this.config.simulateFailure = false;
    this.config.failuresBeforeSuccess = 0;
    this.failureCount = 0;
    this.logger.log('🔄 Simulação de falha resetada');
  }

  getFailureSimulationStatus() {
    return {
      simulateFailure: this.config.simulateFailure,
      failuresBeforeSuccess: this.config.failuresBeforeSuccess,
      currentFailureCount: this.failureCount,
      remainingFailures: Math.max(
        0,
        this.config.failuresBeforeSuccess - this.failureCount,
      ),
    };
  }

  /**
   * Subscribe para eventos de um tipo específico
   */
  subscribe(eventType: EventType, handler: (event: BrokerEvent) => void) {
    this.on(eventType, handler);
    this.logger.log(`👂 Subscriber registrado para evento: ${eventType}`);
  }

  /**
   * Unsubscribe de eventos
   */
  unsubscribe(eventType: EventType, handler: (event: BrokerEvent) => void) {
    this.off(eventType, handler);
    this.logger.log(`🔇 Subscriber removido para evento: ${eventType}`);
  }

  /**
   * Retorna estatísticas do broker
   */
  getStats() {
    return {
      eventTypes: this.eventNames(),
      totalListeners: this.eventNames().reduce(
        (acc, name) => acc + this.listenerCount(name as EventType),
        0,
      ),
      failureSimulation: this.getFailureSimulationStatus(),
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
