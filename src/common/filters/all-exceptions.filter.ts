import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() === 'http') {
      // Manejo para REST
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();

      const httpStatus =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const responseBody = {
        statusCode: httpStatus,
        timestamp: new Date().toISOString(),
        message:
          exception instanceof HttpException
            ? exception.getResponse()
            : 'Internal server error',
      };

      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    } else {
      // Si no es HTTP, asume GraphQL (o puedes ser más específico)
      // Para GraphQL, simplemente lanza la excepción
      throw exception;
    }
  }
}
