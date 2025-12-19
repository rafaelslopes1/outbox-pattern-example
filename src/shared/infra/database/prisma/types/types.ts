import { Prisma } from '@prisma/client';

/**
 * Tipo para representar uma transação do Prisma
 * Permite passar transação para operações atômicas
 * Aceita tanto PrismaClient quanto TransactionClient
 */
export type PrismaTransaction = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
