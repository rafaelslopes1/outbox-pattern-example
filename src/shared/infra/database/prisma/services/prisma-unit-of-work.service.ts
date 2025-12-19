import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.database.service';
import { PrismaTransaction } from '../types';
import { UnitOfWork } from '../../types';

@Injectable()
export class PrismaUnitOfWorkService implements UnitOfWork {
  private currentTransaction: PrismaTransaction | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(fn: (tx: PrismaTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      this.currentTransaction = tx;
      try {
        const result = await fn(tx);
        return result;
      } finally {
        this.currentTransaction = null;
      }
    });
  }

  getCurrentTransaction(): PrismaTransaction | null {
    return this.currentTransaction;
  }
}
