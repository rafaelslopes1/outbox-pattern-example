import { PrismaTransaction } from '../prisma';

/**
 * Unit of Work Pattern
 * Coordena múltiplos repositories dentro de uma única transação
 */
export abstract class UnitOfWork {
  /**
   * Executa operações dentro de uma transação atômica
   */
  abstract transaction<T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T>;

  /**
   * Retorna a transação atual (se existir)
   * Útil para repositories que precisam decidir entre usar tx ou conexão padrão
   */
  abstract getCurrentTransaction(): PrismaTransaction | null;
}
