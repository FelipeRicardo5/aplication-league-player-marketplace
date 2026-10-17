import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')
      .map((origin) => origin.trim()),
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Football League Player Marketplace API')
    .setDescription(
      'API RESTful para gerenciamento de clubes, jogadores, mercado de transferências, escalações e partidas da liga (SENAI/PE CÓD. 237)',
    )
    .setVersion('1.0')
    .addTag('Health', 'Verificação de integridade da API')
    .addTag('Players', 'Cadastro, consulta, edição e exclusão de jogadores')
    .addTag('Clubs', 'Criação, listagem e detalhamento de clubes com elenco')
    .addTag('Market', 'Compra e venda de jogadores com contratos e taxas')
    .addTag('Transactions', 'Histórico e exportação de transações em CSV')
    .addTag('Lineup', 'Definição e consulta de escalação tática')
    .addTag('Matches', 'Simulação de partidas e histórico com 6 duelos')
    .addTag('Standings', 'Classificação dinâmica da liga')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.getOrThrow<number>('PORT'));
}

void bootstrap();
