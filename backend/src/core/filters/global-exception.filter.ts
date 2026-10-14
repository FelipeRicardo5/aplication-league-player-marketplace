import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join('; ');
        } else if (typeof resObj.message === 'string' && resObj.message.trim().length > 0) {
          message = resObj.message;
        } else if (typeof resObj.error === 'string' && resObj.error.trim().length > 0) {
          message = resObj.error;
        } else {
          message = exception.message || 'Erro na requisição';
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Conflito de unicidade de dados';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Recurso não encontrado';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Referência de dados inválida';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Erro ao processar operação no banco de dados';
      }
    } else if (
      exception instanceof SyntaxError &&
      'status' in exception &&
      (exception as { status?: number }).status === 400
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Corpo da requisição contém JSON inválido';
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'type' in exception &&
      (exception as { type?: string }).type === 'entity.parse.failed'
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Corpo da requisição contém JSON inválido';
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.status(status).json({ message });
  }
}
