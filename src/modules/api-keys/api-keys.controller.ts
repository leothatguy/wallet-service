import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';

@Controller('keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post('create')
  async createApiKey(@Req() req, @Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeysService.createApiKey(req.user.userId, createApiKeyDto);
  }

  @Post('rollover')
  async rolloverApiKey(@Req() req, @Body() rolloverDto: RolloverApiKeyDto) {
    return this.apiKeysService.rolloverApiKey(req.user.userId, rolloverDto);
  }
}
