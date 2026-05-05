import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CommonErrors } from '@xlr8-nest/core/constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : typeof exception?.statusCode === 'number'
          ? exception.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const responsePayload =
      exceptionResponse && typeof exceptionResponse === 'object'
        ? (exceptionResponse as Record<string, any>)
        : null;
    const message =
      responsePayload?.message ??
      (exception as any)?.message ??
      CommonErrors.InternalServerError.message;
    const code =
      responsePayload?.code ??
      (exception as any)?.code ??
      CommonErrors.InternalServerError.code;
    if (exception instanceof Error) {
      this.logger.error(`Error on ${request.method} ${request.url}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception on ${request.method} ${request.url}`);
    }

    const responseBody = {
      success: false,
      message,
      code,
      data: null,
    };

    if (responsePayload?.errors) {
      (responseBody as Record<string, any>).errors = responsePayload.errors;
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
