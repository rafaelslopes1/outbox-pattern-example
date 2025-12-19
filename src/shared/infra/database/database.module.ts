import { Global, Module } from '@nestjs/common';
import { PrismaService, PrismaUnitOfWorkService } from './prisma';
import { UnitOfWork } from './types';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: UnitOfWork,
      useClass: PrismaUnitOfWorkService,
    },
  ],
  exports: [PrismaService, UnitOfWork],
})
export class DatabaseModule {}
