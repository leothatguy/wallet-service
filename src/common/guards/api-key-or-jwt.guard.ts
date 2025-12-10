import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';
import { Permission } from '../../entities/api-key.entity';

@Injectable()
export class ApiKeyOrJwtGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const authHeader = request.headers['authorization'];

    // Get required permission from decorator
    const requiredPermission = this.reflector.get<Permission>(
      'permission',
      context.getHandler(),
    );

    // If API key is provided
    if (apiKey) {
      const validation = await this.apiKeysService.validateApiKey(
        apiKey,
        requiredPermission,
      );

      if (!validation.valid) {
        throw new ForbiddenException('Invalid or insufficient API key');
      }

      // Attach userId to request
      request.user = { userId: validation.userId };
      return true;
    }

    // If JWT is provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT will be handled by JwtAuthGuard
      return true;
    }

    throw new UnauthorizedException('No authentication provided');
  }
}
