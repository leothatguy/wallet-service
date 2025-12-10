import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

/**
 * Swagger documentation for Create API Key endpoint
 */
export const CreateApiKeyDocs = () =>
  applyDecorators(
    ApiTags('API Keys') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiOperation({
      summary: 'Create a new API key',
      description:
        'Generate a new API key with custom permissions and expiry. Maximum 5 active keys allowed per user. The generated API key will be returned only once and cannot be retrieved again.',
    }),
    ApiBody({
      description: 'API key creation parameters',
      schema: {
        type: 'object',
        required: ['name', 'permissions', 'expiry'],
        properties: {
          name: {
            type: 'string',
            description: 'A descriptive name for the API key',
            example: 'Production API Key',
          },
          permissions: {
            type: 'array',
            description:
              'Array of permissions to grant to this API key. At least one permission is required.',
            items: {
              type: 'string',
              enum: ['deposit', 'transfer', 'read'],
            },
            minItems: 1,
            example: ['deposit', 'transfer', 'read'],
          },
          expiry: {
            type: 'string',
            description: 'Expiration duration for the API key',
            enum: ['1H', '1D', '1M', '1Y'],
            example: '1M',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'API key created successfully',
      schema: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description:
              'The generated API key. Store this securely - it will not be shown again!',
            example: 'wsk_example_1234567890abcdef',
          },
          expires_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp when the API key expires',
            example: '2025-01-10T22:12:26.000Z',
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            type: 'string',
            example: 'Maximum 5 active API keys allowed per user',
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Rollover API Key endpoint

 */
export const RolloverApiKeyDocs = () =>
  applyDecorators(
    ApiTags('API Keys') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiOperation({
      summary: 'Rollover an API key',
      description:
        'Replace an expired or expiring API key with a new one. The old key will be deactivated and a new key with the same permissions will be generated. The key must be expired or expiring within 7 days to be eligible for rollover. Provide either the raw API key or the expired key ID.',
    }),
    ApiBody({
      description: 'API key rollover parameters',
      schema: {
        type: 'object',
        required: ['expiry'],
        properties: {
          expired_key_id: {
            type: 'string',
            format: 'uuid',
            description:
              'UUID of the expired API key. Provide either this or api_key.',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          api_key: {
            type: 'string',
            description:
              'The raw API key to rollover. Provide either this or expired_key_id.',
            example: 'wsk_example_1234567890abcdef',
          },
          expiry: {
            type: 'string',
            description: 'Expiration duration for the new API key',
            enum: ['1H', '1D', '1M', '1Y'],
            example: '1M',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description:
        'API key rolled over successfully. Old key deactivated, new key generated.',
      schema: {
        type: 'object',
        properties: {
          api_key: {
            type: 'string',
            description:
              'The new generated API key. Store this securely - it will not be shown again!',
            example: 'wsk_example_9876543210fedcba',
          },
          expires_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 timestamp when the new API key expires',
            example: '2025-01-10T22:12:26.000Z',
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            oneOf: [
              {
                type: 'string',
                example: 'Either api_key or expired_key_id must be provided',
              },
              {
                type: 'string',
                example:
                  'API key must be expired or expiring within 7 days to rollover',
              },
            ],
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }) as MethodDecorator,
    ApiResponse({
      status: 404,
      description: 'API key not found or does not belong to the user',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'API key not found' },
          error: { type: 'string', example: 'Not Found' },
        },
      },
    }) as MethodDecorator,
  );
