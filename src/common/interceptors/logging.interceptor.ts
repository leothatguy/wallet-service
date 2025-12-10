import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const ip = headers['x-forwarded-for'] || request.ip;
    const startTime = Date.now();

    // Log incoming request
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log(`📨 INCOMING REQUEST`);
    this.logger.log(`Method: ${method}`);
    this.logger.log(`URL: ${url}`);
    this.logger.log(`IP: ${ip}`);
    this.logger.log(`User-Agent: ${userAgent}`);

    if (params && Object.keys(params).length > 0) {
      this.logger.log(`Params: ${JSON.stringify(params)}`);
    }

    if (query && Object.keys(query).length > 0) {
      this.logger.log(`Query: ${JSON.stringify(query)}`);
    }

    if (body && Object.keys(body).length > 0) {
      // Sanitize sensitive data
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.log(`Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log('─────────────────────────────────────────');
          this.logger.log(`✅ RESPONSE SENT`);
          this.logger.log(`Status: ${statusCode}`);
          this.logger.log(`Duration: ${duration}ms`);

          if (data) {
            const sanitizedData = this.sanitizeBody(data);
            this.logger.log(
              `Response: ${JSON.stringify(sanitizedData, null, 2)}`,
            );
          }

          this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          this.logger.error('─────────────────────────────────────────');
          this.logger.error(`❌ REQUEST FAILED`);
          this.logger.error(`Duration: ${duration}ms`);
          this.logger.error(`Error: ${error.message}`);
          this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        },
      }),
    );
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'api_key',
      'authorization',
    ];

    const sanitized = JSON.parse(JSON.stringify(body));

    const sanitizeObject = (obj: Record<string, unknown>): void => {
      for (const key in obj) {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key] as Record<string, unknown>);
        }
      }
    };

    sanitizeObject(sanitized as Record<string, unknown>);
    return sanitized;
  }
}
