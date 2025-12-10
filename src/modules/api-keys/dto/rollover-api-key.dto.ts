import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

export class RolloverApiKeyDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  expired_key_id?: string;

  @IsOptional()
  @IsString()
  api_key?: string;

  @IsString()
  @IsEnum(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
