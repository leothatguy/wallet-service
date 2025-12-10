import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../entities/api-key.entity';

export const RequirePermission = (permission: Permission) =>
  SetMetadata('permission', permission);
