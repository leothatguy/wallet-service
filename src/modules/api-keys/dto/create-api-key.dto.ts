import { IsString, IsEnum, IsArray, ArrayMinSize } from 'class-validator';
import { Permission } from '../../../entities/api-key.entity';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Permission, { each: true })
  permissions: Permission[];

  @IsString()
  @IsEnum(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
