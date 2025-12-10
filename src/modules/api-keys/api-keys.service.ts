import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey, Permission } from '../../entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    private configService: ConfigService,
  ) {}

  async createApiKey(userId: string, createApiKeyDto: CreateApiKeyDto) {
    // Check active keys count
    const activeKeysCount = await this.apiKeyRepository.count({
      where: {
        userId,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeKeysCount >= 5) {
      throw new BadRequestException(
        'Maximum 5 active API keys allowed per user',
      );
    }

    // Generate unique API key
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    // Parse expiry
    const expiresAt = this.parseExpiry(createApiKeyDto.expiry);

    // Create and save API key
    const apiKey = this.apiKeyRepository.create({
      userId,
      name: createApiKeyDto.name,
      keyHash,
      permissions: createApiKeyDto.permissions,
      expiresAt,
      isActive: true,
    });

    await this.apiKeyRepository.save(apiKey);

    return {
      api_key: rawKey,
      expires_at: expiresAt.toISOString(),
    };
  }

  async rolloverApiKey(userId: string, rolloverDto: RolloverApiKeyDto) {
    let expiredKey: ApiKey | null = null;

    // Try to find by API key first (if provided)
    if (rolloverDto.api_key) {
      // Find all user's keys and check which one matches
      const userKeys = await this.apiKeyRepository.find({
        where: { userId },
      });

      for (const key of userKeys) {
        const isMatch = await bcrypt.compare(rolloverDto.api_key, key.keyHash);
        if (isMatch) {
          expiredKey = key;
          break;
        }
      }

      if (!expiredKey) {
        throw new NotFoundException('API key not found');
      }
    }
    // Otherwise, try to find by ID
    else if (rolloverDto.expired_key_id) {
      expiredKey = await this.apiKeyRepository.findOne({
        where: { id: rolloverDto.expired_key_id, userId },
      });

      if (!expiredKey) {
        throw new NotFoundException('API key not found');
      }
    } else {
      throw new BadRequestException(
        'Either api_key or expired_key_id must be provided',
      );
    }

    // Validate it's actually expired or close to expiry (within 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (expiredKey.expiresAt > sevenDaysFromNow) {
      throw new BadRequestException(
        'API key must be expired or expiring within 7 days to rollover',
      );
    }

    // Deactivate old key
    expiredKey.isActive = false;
    await this.apiKeyRepository.save(expiredKey);

    // Create new key with same permissions
    return this.createApiKey(userId, {
      name: expiredKey.name,
      permissions: expiredKey.permissions,
      expiry: rolloverDto.expiry,
    });
  }

  async validateApiKey(
    rawKey: string,
    requiredPermission?: Permission,
  ): Promise<{ valid: boolean; userId?: string }> {
    // Find all active keys
    const activeKeys = await this.apiKeyRepository.find({
      where: {
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    // Check if any key matches
    for (const key of activeKeys) {
      const isMatch = await bcrypt.compare(rawKey, key.keyHash);
      if (isMatch) {
        // Check permission if required
        if (
          requiredPermission &&
          !key.permissions.includes(requiredPermission)
        ) {
          return { valid: false };
        }
        return { valid: true, userId: key.userId };
      }
    }

    return { valid: false };
  }

  parseExpiry(expiry: string): Date {
    const now = new Date();
    switch (expiry) {
      case '1H':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1D':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1M':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case '1Y':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }
}
