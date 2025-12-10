import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';
import { Permission } from '../../entities/api-key.entity';
import type { RequestUser } from '../../types/request.types';

@Injectable()
export class ApiKeyOrJwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: RequestUser }>();
    const apiKey = request.headers['x-api-key'];
    const authHeader = request.headers.authorization;
    // Get required permission from decorator
    const requiredPermission = this.reflector.get<Permission>(
      'permission',
      context.getHandler(),
    );

    // If API key is provided
    if (apiKey && typeof apiKey === 'string') {
      const validation = await this.apiKeysService.validateApiKey(
        apiKey,
        requiredPermission,
      );

      if (!validation.valid) {
        throw new ForbiddenException('Invalid or insufficient API key');
      }

      // Attach userId to request
      request.user = { userId: validation.userId!, email: '' };
      return true;
    }

    // If JWT is provided
    if (authHeader?.startsWith('Bearer ')) {
      // JWT will be handled by JwtAuthGuard
      return true;
    }

    throw new UnauthorizedException('No authentication provided');
  }
}
