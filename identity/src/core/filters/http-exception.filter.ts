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
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : CommonErrors.InternalServerError.message;
    const code = (exception as any)?.code ?? CommonErrors.InternalServerError.code;
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

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}
