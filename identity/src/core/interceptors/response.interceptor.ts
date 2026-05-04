// http-status.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '@xlr8-nest/core/response';

@Injectable()
export class HTTPStatusInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<any> | any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse<Response>();
    

    return next.handle().pipe(
      map((data) => {
        if(data?.statusCode) {
          res.status(data.statusCode);
          delete data.statusCode;
        }
        return data;
      }),
    );
  }
}
