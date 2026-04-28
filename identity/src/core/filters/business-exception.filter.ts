import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { buildErrorResponse } from '@xlr8-nest/core/response';
import { StatusCode } from '@xlr8-nest/core/constants';
import { BaseError } from '@xlr8-nest/core/errors';

@Catch(BaseError)
export class BusinessExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: BaseError, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const errorResponse = buildErrorResponse(exception);
    const { statusCode, ...responseBody } = errorResponse;

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode || StatusCode.INTERNAL_SERVER_ERROR);
  }
}
