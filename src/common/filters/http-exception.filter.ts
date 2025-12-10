import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extract message from exception response
    let errorMessage: string;
    if (typeof message === 'string') {
      errorMessage = message;
    } else if (typeof message === 'object' && message !== null) {
      errorMessage =
        (message as Record<string, unknown>).message?.toString() ||
        'An error occurred';
    } else {
      errorMessage = 'An error occurred';
    }

    // Standardized error response
    const errorResponse = {
      error: this.getErrorType(status),
      status_code: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Detailed error logging
    this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.error(`🚨 EXCEPTION CAUGHT`);
    this.logger.error(`Status: ${status}`);
    this.logger.error(`Method: ${request.method}`);
    this.logger.error(`URL: ${request.url}`);
    this.logger.error(`Timestamp: ${errorResponse.timestamp}`);
    this.logger.error(`Message: ${errorMessage}`);

    if (exception instanceof Error) {
      this.logger.error(`Error Name: ${exception.name}`);
      this.logger.error(`Stack Trace:\n${exception.stack}`);
    }

    if (request.body && Object.keys(request.body).length > 0) {
      this.logger.error(
        `Request Body: ${JSON.stringify(request.body, null, 2)}`,
      );
    }

    if (request.query && Object.keys(request.query).length > 0) {
      this.logger.error(
        `Query Params: ${JSON.stringify(request.query, null, 2)}`,
      );
    }

    if (request.params && Object.keys(request.params).length > 0) {
      this.logger.error(
        `URL Params: ${JSON.stringify(request.params, null, 2)}`,
      );
    }

    this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    response.status(status).json(errorResponse);
  }

  private getErrorType(status: number): string {
    const errorTypes: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    return errorTypes[status] || 'Error';
  }
}
