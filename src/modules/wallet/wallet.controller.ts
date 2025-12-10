import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { ApiKeyOrJwtGuard } from '../../common/guards/api-key-or-jwt.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../entities/api-key.entity';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('deposit')
  @UseGuards(AuthGuard('jwt'), ApiKeyOrJwtGuard)
  @RequirePermission(Permission.DEPOSIT)
  async deposit(@Req() req, @Body() depositDto: DepositDto) {
    return this.walletService.initiateDeposit(req.user.userId, depositDto);
  }

  @Post('paystack/webhook')
  async paystackWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    await this.walletService.handlePaystackWebhook(payload, signature);
    return { status: true };
  }

  @Get('deposit/:reference/status')
  @UseGuards(AuthGuard('jwt'), ApiKeyOrJwtGuard)
  @RequirePermission(Permission.READ)
  async getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @Get('balance')
  @UseGuards(AuthGuard('jwt'), ApiKeyOrJwtGuard)
  @RequirePermission(Permission.READ)
  async getBalance(@Req() req) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Post('transfer')
  @UseGuards(AuthGuard('jwt'), ApiKeyOrJwtGuard)
  @RequirePermission(Permission.TRANSFER)
  async transfer(@Req() req, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(req.user.userId, transferDto);
  }

  @Get('transactions')
  @UseGuards(AuthGuard('jwt'), ApiKeyOrJwtGuard)
  @RequirePermission(Permission.READ)
  async getTransactions(@Req() req) {
    return this.walletService.getTransactionHistory(req.user.userId);
  }
}
