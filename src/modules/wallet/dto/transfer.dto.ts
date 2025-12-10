import { IsString, IsNumber, Min, Length } from 'class-validator';

export class TransferDto {
  @IsString()
  @Length(13, 13)
  wallet_number: string;

  @IsNumber()
  @Min(100)
  amount: number;
}
