import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import type { AuthenticatedRequest } from '../../types/request.types';
import { CreateApiKeyDocs, RolloverApiKeyDocs } from './docs/api-keys.swagger';

@ApiTags('API Keys')
@Controller('keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post('create')
  @CreateApiKeyDocs()
  createApiKey(
    @Req() req: AuthenticatedRequest,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createApiKey(req.user.userId, createApiKeyDto);
  }

  @Post('rollover')
  @RolloverApiKeyDocs()
  rolloverApiKey(
    @Req() req: AuthenticatedRequest,
    @Body() rolloverDto: RolloverApiKeyDto,
  ) {
    return this.apiKeysService.rolloverApiKey(req.user.userId, rolloverDto);
  }
}
