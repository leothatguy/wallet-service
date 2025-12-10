import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Swagger documentation for Google OAuth initiation
 */
export const GoogleAuthDocs = (): MethodDecorator =>
  applyDecorators(
    ApiTags('Authentication') as MethodDecorator,
    ApiOperation({
      summary: 'Initiate Google OAuth',
      description: 'Redirects user to Google OAuth consent screen',
    }),
    ApiResponse({
      status: 302,
      description: 'Redirects to Google OAuth',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Google OAuth callback
 */
export const GoogleCallbackDocs = (): MethodDecorator =>
  applyDecorators(
    ApiTags('Authentication') as MethodDecorator,
    ApiOperation({
      summary: 'Google OAuth callback',
      description:
        'Handles Google OAuth callback, creates user if needed, and returns JWT token',
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully authenticated',
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-here' },
              email: { type: 'string', example: 'user@example.com' },
              name: { type: 'string', example: 'John Doe' },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 401,
      description: 'Authentication failed',
    }) as MethodDecorator,
  );
