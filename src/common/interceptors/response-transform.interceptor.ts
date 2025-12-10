import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;

        // If data already has our response format, return as-is
        if (
          data &&
          typeof data === 'object' &&
          'status_code' in data &&
          'message' in data &&
          'data' in data
        ) {
          return data as ApiResponse<T>;
        }

        // Transform to standard response format
        return {
          status_code: statusCode,
          message: this.getSuccessMessage(statusCode),
          data: data as T,
        };
      }),
    );
  }

  private getSuccessMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      200: 'Request successful',
      201: 'Resource created successfully',
      204: 'Request successful',
    };

    return messages[statusCode] || 'Success';
  }
}
