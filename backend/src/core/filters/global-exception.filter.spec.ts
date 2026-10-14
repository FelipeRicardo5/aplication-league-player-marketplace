import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockHost: ArgumentsHost;
  let responseData: {
    status?: number;
    json?: Record<string, unknown>;
    headers?: Record<string, string>;
  };

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    responseData = { headers: {} };

    mockResponse = {
      setHeader: jest.fn((name: string, value: string) => {
        responseData.headers![name] = value;
        return mockResponse as Response;
      }),
      status: jest.fn((statusCode: number) => {
        responseData.status = statusCode;
        return mockResponse as Response;
      }),
      json: jest.fn((body: Record<string, unknown>) => {
        responseData.json = body;
        return mockResponse as Response;
      }),
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle standard BadRequestException', () => {
    filter.catch(new BadRequestException('Parâmetro inválido'), mockHost);

    expect(responseData.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseData.json).toEqual({ message: 'Parâmetro inválido' });
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/json; charset=utf-8',
    );
  });

  it('should handle NotFoundException', () => {
    filter.catch(new NotFoundException('Clube não encontrado'), mockHost);

    expect(responseData.status).toBe(HttpStatus.NOT_FOUND);
    expect(responseData.json).toEqual({ message: 'Clube não encontrado' });
  });

  it('should handle ConflictException', () => {
    filter.catch(new ConflictException('Jogador já possui clube'), mockHost);

    expect(responseData.status).toBe(HttpStatus.CONFLICT);
    expect(responseData.json).toEqual({ message: 'Jogador já possui clube' });
  });

  it('should format array of messages from validation pipe into single string', () => {
    const error = new BadRequestException({
      message: ['Campo nome obrigatório', 'Idade deve ser maior que 16'],
      error: 'Bad Request',
    });

    filter.catch(error, mockHost);

    expect(responseData.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseData.json).toEqual({
      message: 'Campo nome obrigatório; Idade deve ser maior que 16',
    });
  });

  it('should handle Prisma P2002 unique constraint error as 409 Conflict', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`sigla`)',
      {
        code: 'P2002',
        clientVersion: '6.19.3',
      },
    );

    filter.catch(prismaError, mockHost);

    expect(responseData.status).toBe(HttpStatus.CONFLICT);
    expect(responseData.json).toEqual({ message: 'Conflito de unicidade de dados' });
  });

  it('should handle Prisma P2025 not found error as 404 Not Found', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
      code: 'P2025',
      clientVersion: '6.19.3',
    });

    filter.catch(prismaError, mockHost);

    expect(responseData.status).toBe(HttpStatus.NOT_FOUND);
    expect(responseData.json).toEqual({ message: 'Recurso não encontrado' });
  });

  it('should handle Express body-parser SyntaxError as 400 Bad Request', () => {
    const syntaxError = new SyntaxError('Unexpected token in JSON');
    Object.assign(syntaxError, { status: 400 });

    filter.catch(syntaxError, mockHost);

    expect(responseData.status).toBe(HttpStatus.BAD_REQUEST);
    expect(responseData.json).toEqual({
      message: 'Corpo da requisição contém JSON inválido',
    });
  });

  it('should handle unhandled error as 500 without leaking stack trace', () => {
    const genericError = new Error('Database connection timeout error with sensitive internals');

    filter.catch(genericError, mockHost);

    expect(responseData.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(responseData.json).toEqual({ message: 'Erro interno do servidor' });
    expect(responseData.json?.stack).toBeUndefined();
  });
});
