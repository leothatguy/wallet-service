import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { ApiKeyOrJwtGuard } from '../../common/guards/api-key-or-jwt.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Permission } from '../../entities/api-key.entity';
import type { AuthenticatedRequest } from '../../types/request.types';
import type { PaystackWebhookPayload } from '../../types/paystack.types';
import {
  DepositDocs,
  GetBalanceDocs,
  TransferDocs,
  GetTransactionsDocs,
  PaystackWebhookDocs,
  GetDepositStatusDocs,
  GetWalletInfoDocs,
} from './docs/wallet.swagger';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('deposit')
  @DepositDocs()
  @UseGuards(ApiKeyOrJwtGuard)
  @RequirePermission(Permission.DEPOSIT)
  deposit(@Req() req: AuthenticatedRequest, @Body() depositDto: DepositDto) {
    return this.walletService.initiateDeposit(req.user.userId, depositDto);
  }

  @Post('paystack/webhook')
  @PaystackWebhookDocs()
  async paystackWebhook(
    @Body() payload: PaystackWebhookPayload,
    @Headers('x-paystack-signature') signature: string,
  ) {
    await this.walletService.handlePaystackWebhook(payload, signature);
    return { status: true };
  }

  @Get('deposit/:reference/status')
  @GetDepositStatusDocs()
  @UseGuards(ApiKeyOrJwtGuard)
  @RequirePermission(Permission.READ)
  getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @Get('info')
  @GetWalletInfoDocs()
  @UseGuards(ApiKeyOrJwtGuard)
  @RequirePermission(Permission.READ)
  getWalletInfo(@Req() req: AuthenticatedRequest) {
    return this.walletService.getWalletInfo(req.user.userId);
  }

  @Get('balance')
  @GetBalanceDocs()
  @UseGuards(ApiKeyOrJwtGuard)
  @RequirePermission(Permission.READ)
  getBalance(@Req() req: AuthenticatedRequest) {
    return this.walletService.getBalance(req.user.userId);
  }

  @Post('transfer')
  @TransferDocs()
  @UseGuards(ApiKeyOrJwtGuard)
  @RequirePermission(Permission.TRANSFER)
  transfer(@Req() req: AuthenticatedRequest, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(req.user.userId, transferDto);
  }

  @Get('transactions')
  @GetTransactionsDocs()
  @UseGuards(ApiKeyOrJwtGuard)
  @RequirePermission(Permission.READ)
  getTransactions(@Req() req: AuthenticatedRequest) {
    return this.walletService.getTransactionHistory(req.user.userId);
  }
}
