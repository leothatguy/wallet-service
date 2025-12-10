import { IsString, IsUUID, IsEnum } from 'class-validator';

export class RolloverApiKeyDto {
  @IsString()
  @IsUUID()
  expired_key_id: string;

  @IsString()
  @IsEnum(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
