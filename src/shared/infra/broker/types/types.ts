import { $Enums } from '@prisma/client';

export type EventType = $Enums.EventType;

export type BrokerConfig = {
  simulateFailure: boolean; // Se está em modo de simulação de falha
  failuresBeforeSuccess: number; // Número de falhas a simular antes do sucesso
};

export type BrokerEvent = {
  eventId: string;
  eventType: EventType;
  payload: any;
};
