import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Swagger documentation for Create API Key endpoint
 */
export const CreateApiKeyDocs = () =>
  applyDecorators(
    ApiTags('API Keys') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiOperation({
      summary: 'Create a new API key',
      description: 'Generate a new API key with custom permissions and expiry',
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
        'Replace an expired or expiring key with a new one. Provide either api_key or expired_key_id',
    }) as MethodDecorator,
  );
