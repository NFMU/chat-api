// http-status.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HTTP_STATUS_KEY, RAW_RESPONSE_KEY } from '../decorators/http-status.decorator';
import { buildSuccessResponse } from '@xlr8-nest/core/response';
import { StatusCode } from '@xlr8-nest/core';

@Injectable()
export class HTTPStatusInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<any> | any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse<Response>();

    // Check if raw response is requested (bypass wrapping)
    const isRawResponse =
      this.reflector.get<boolean>(RAW_RESPONSE_KEY, context.getHandler()) ??
      this.reflector.get<boolean>(RAW_RESPONSE_KEY, context.getClass()) ??
      false;

    // Get status from decorator (priority: handler > controller > default 200)
    const decoratorStatus =
      this.reflector.get<number>(HTTP_STATUS_KEY, context.getHandler()) ??
      this.reflector.get<number>(HTTP_STATUS_KEY, context.getClass()) ??
      StatusCode.SUCCESS;

    return next.handle().pipe(
      map((data) => {
        // If status is 200 and data is null/undefined, return 204 No Content
        let finalStatus = decoratorStatus;
        if (decoratorStatus === StatusCode.SUCCESS && (data === null || data === undefined)) {
          finalStatus = StatusCode.NO_CONTENT;
        }

        // Set HTTP status code
        res.status(finalStatus);

        // Return raw data without wrapping if @RawResponse() is used
        if (isRawResponse) {
          return data;
        }

        // Build standardized response
        return buildSuccessResponse(finalStatus, data);
      }),
    );
  }
}
