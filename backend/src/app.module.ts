import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { stdTimeFunctions } from 'pino';
import { LoggerModule } from 'nestjs-pino';

import { DomainModule } from './domain/domain.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        timestamp: stdTimeFunctions.isoTime,
        ...(process.env.NODE_ENV !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true },
              },
            }
          : {}),
      },
    }),
    PrismaModule,
    DomainModule,
    HealthModule,
  ],
})
export class AppModule {}
