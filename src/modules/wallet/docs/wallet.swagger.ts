import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';

/**
 * Swagger documentation for Deposit endpoint
 */
export const DepositDocs = () =>
  applyDecorators(
    ApiTags('Wallet') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiHeader({
      name: 'x-api-key',
      description: 'API key (alternative to JWT)',
      required: false,
    }) as MethodDecorator,
    ApiOperation({
      summary: 'Initiate a wallet deposit',
      description:
        'Initialize a Paystack payment for wallet deposit. Requires JWT or API key with "deposit" permission.',
    }) as MethodDecorator,
    ApiBody({
      schema: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: {
            type: 'number',
            minimum: 100,
            example: 5000,
            description: 'Amount to deposit (minimum 100)',
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 201,
      description: 'Deposit initialized successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 201 },
          message: { type: 'string', example: 'Resource created successfully' },
          data: {
            type: 'object',
            properties: {
              reference: {
                type: 'string',
                example: 'TXN_1234567890_abc123',
              },
              authorization_url: {
                type: 'string',
                example: 'https://paystack.co/checkout/...',
                description: 'URL to redirect user for payment',
              },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 400,
      description: 'Failed to initialize payment',
      schema: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Bad Request' },
          status_code: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Failed to initialize payment' },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT or API key required',
    }) as MethodDecorator,
    ApiResponse({
      status: 403,
      description: 'API key lacks "deposit" permission',
    }) as MethodDecorator,
    ApiResponse({
      status: 404,
      description: 'Wallet not found',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Paystack Webhook endpoint
 */
export const PaystackWebhookDocs = () =>
  applyDecorators(
    ApiTags('Wallet') as MethodDecorator,
    ApiOperation({
      summary: 'Paystack webhook handler',
      description:
        'Receives payment notifications from Paystack and credits wallet on successful payment. Signature verification is mandatory.',
    }) as MethodDecorator,
    ApiHeader({
      name: 'x-paystack-signature',
      description: 'Paystack webhook signature for verification',
      required: true,
    }) as MethodDecorator,
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          event: {
            type: 'string',
            example: 'charge.success',
          },
          data: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string' },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 200,
      description: 'Webhook processed successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'boolean', example: true },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 400,
      description: 'Invalid signature',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Get Deposit Status endpoint
 */
export const GetDepositStatusDocs = () =>
  applyDecorators(
    ApiTags('Wallet') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiHeader({
      name: 'x-api-key',
      description: 'API key (alternative to JWT)',
      required: false,
    }) as MethodDecorator,
    ApiOperation({
      summary: 'Check deposit transaction status',
      description:
        'Retrieve the status of a deposit transaction. This endpoint does NOT credit the wallet.',
    }) as MethodDecorator,
    ApiParam({
      name: 'reference',
      description: 'Transaction reference',
      example: 'TXN_1234567890_abc123',
    }) as MethodDecorator,
    ApiResponse({
      status: 200,
      description: 'Transaction status retrieved',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              status: {
                type: 'string',
                enum: ['pending', 'success', 'failed'],
              },
              amount: { type: 'number' },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 404,
      description: 'Transaction not found',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Get Wallet Info endpoint
 */
export const GetWalletInfoDocs = () =>
  applyDecorators(
    ApiTags('Wallet') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiHeader({
      name: 'x-api-key',
      description: 'API key (alternative to JWT)',
      required: false,
    }) as MethodDecorator,
    ApiOperation({
      summary: 'Get wallet information',
      description:
        'Retrieve wallet details including wallet number, balance, and creation date. Requires JWT or API key with "read" permission.',
    }) as MethodDecorator,
    ApiResponse({
      status: 200,
      description: 'Wallet information retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              wallet_number: {
                type: 'string',
                example: '1733851234567',
                description: '13-digit unique wallet number',
              },
              balance: {
                type: 'number',
                example: 15000,
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                example: '2025-12-10T18:00:00.000Z',
              },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 401,
      description: 'Unauthorized - JWT or API key required',
    }) as MethodDecorator,
    ApiResponse({
      status: 404,
      description: 'Wallet not found',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Get Balance endpoint
 */
export const GetBalanceDocs = () =>
  applyDecorators(
    ApiTags('Wallet') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiHeader({
      name: 'x-api-key',
      description: 'API key (alternative to JWT)',
      required: false,
    }) as MethodDecorator,
    ApiOperation({
      summary: 'Get wallet balance',
      description:
        'Retrieve current wallet balance. Requires JWT or API key with "read" permission.',
    }) as MethodDecorator,
    ApiResponse({
      status: 200,
      description: 'Balance retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              balance: {
                type: 'number',
                example: 15000,
              },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 404,
      description: 'Wallet not found',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Transfer endpoint
 */
export const TransferDocs = () =>
  applyDecorators(
    ApiTags('Wallet') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiHeader({
      name: 'x-api-key',
      description: 'API key (alternative to JWT)',
      required: false,
    }) as MethodDecorator,
    ApiOperation({
      summary: 'Transfer funds to another wallet',
      description:
        'Transfer money from your wallet to another user\'s wallet. Requires JWT or API key with "transfer" permission.',
    }) as MethodDecorator,
    ApiBody({
      schema: {
        type: 'object',
        required: ['wallet_number', 'amount'],
        properties: {
          wallet_number: {
            type: 'string',
            minLength: 13,
            maxLength: 13,
            example: '4566678954356',
            description: '13-digit recipient wallet number',
          },
          amount: {
            type: 'number',
            minimum: 100,
            example: 3000,
            description: 'Amount to transfer',
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 200,
      description: 'Transfer completed successfully',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'success' },
              message: { type: 'string', example: 'Transfer completed' },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 400,
      description: 'Insufficient balance or cannot transfer to yourself',
    }) as MethodDecorator,
    ApiResponse({
      status: 404,
      description: 'Invalid wallet number',
    }) as MethodDecorator,
  );

/**
 * Swagger documentation for Get Transactions endpoint
 */
export const GetTransactionsDocs = () =>
  applyDecorators(
    ApiTags('Wallet') as MethodDecorator,
    ApiBearerAuth() as MethodDecorator,
    ApiHeader({
      name: 'x-api-key',
      description: 'API key (alternative to JWT)',
      required: false,
    }) as MethodDecorator,
    ApiOperation({
      summary: 'Get transaction history',
      description:
        'Retrieve all transactions for the authenticated user\'s wallet. Requires JWT or API key with "read" permission.',
    }) as MethodDecorator,
    ApiResponse({
      status: 200,
      description: 'Transaction history retrieved',
      schema: {
        type: 'object',
        properties: {
          status_code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Request successful' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['deposit', 'transfer_in', 'transfer_out'],
                },
                amount: { type: 'number' },
                status: {
                  type: 'string',
                  enum: ['pending', 'success', 'failed'],
                },
                recipient_wallet_number: {
                  type: 'string',
                  nullable: true,
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
      },
    }) as MethodDecorator,
    ApiResponse({
      status: 404,
      description: 'Wallet not found',
    }) as MethodDecorator,
  );
