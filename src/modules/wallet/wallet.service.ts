import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';
import {
  Wallet,
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../../entities';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import type { PaystackWebhookPayload } from '../../types/paystack.types';

@Injectable()
export class WalletService {
  private paystackSecretKey: string;

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    this.paystackSecretKey =
      this.configService.get<string>('paystack.secretKey') || '';
  }

  async initiateDeposit(userId: string, depositDto: DepositDto) {
    // Get user's wallet
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Generate unique reference
    const reference = `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create pending transaction
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      type: TransactionType.DEPOSIT,
      amount: depositDto.amount,
      status: TransactionStatus.PENDING,
      reference,
    });

    await this.transactionRepository.save(transaction);

    // Initialize Paystack transaction
    try {
      const response = await axios.post<{
        status: boolean;
        message: string;
        data: {
          authorization_url: string;
          access_code: string;
          reference: string;
        };
      }>(
        'https://api.paystack.co/transaction/initialize',
        {
          email: wallet.user.email,
          amount: depositDto.amount * 100, // Convert to kobo
          reference,
          callback_url: `${this.configService.get('app.appUrl')}/wallet/deposit/${reference}/status`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        reference,
        authorization_url: response.data.data.authorization_url,
      };
    } catch {
      // Mark transaction as failed
      transaction.status = TransactionStatus.FAILED;
      await this.transactionRepository.save(transaction);
      throw new BadRequestException('Failed to initialize payment');
    }
  }

  async handlePaystackWebhook(
    payload: PaystackWebhookPayload,
    signature: string,
  ): Promise<void> {
    // Allow bypassing signature verification in development/testing
    const skipSignatureCheck =
      this.configService.get<string>('PAYSTACK_SKIP_SIGNATURE_CHECK') ===
      'true';

    if (!skipSignatureCheck) {
      // Verify signature
      const hash = crypto
        .createHmac('sha512', this.paystackSecretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        throw new BadRequestException('Invalid signature');
      }
    } else {
      console.log(
        '⚠️  WARNING: Paystack signature verification is DISABLED for testing',
      );
    }

    const { event, data } = payload;

    if (event === 'charge.success') {
      const reference = data.reference;

      // Find transaction
      const transaction = await this.transactionRepository.findOne({
        where: { reference },
        relations: ['wallet'],
      });

      if (!transaction) {
        return; // Transaction not found, ignore
      }

      // Only process if pending (idempotency)
      if (transaction.status === TransactionStatus.PENDING) {
        await this.dataSource.transaction(async (manager) => {
          // Update transaction status
          transaction.status = TransactionStatus.SUCCESS;
          await manager.save(transaction);

          // Credit wallet
          const wallet = transaction.wallet;
          wallet.balance = Number(wallet.balance) + Number(transaction.amount);
          await manager.save(wallet);
        });
      }
    }
  }

  async getDepositStatus(reference: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference,
      status: transaction.status,
      amount: transaction.amount,
    };
  }

  async getWalletInfo(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      wallet_number: wallet.walletNumber,
      balance: Number(wallet.balance),
      created_at: wallet.createdAt,
    };
  }

  async getBalance(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: Number(wallet.balance),
    };
  }

  async transfer(userId: string, transferDto: TransferDto) {
    // Find recipient wallet
    const recipientWallet = await this.walletRepository.findOne({
      where: { walletNumber: transferDto.wallet_number },
    });

    if (!recipientWallet) {
      throw new NotFoundException('Invalid wallet number');
    }

    // Get sender wallet
    const senderWallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!senderWallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Prevent self-transfer
    if (senderWallet.id === recipientWallet.id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    // Perform atomic transfer
    await this.dataSource.transaction(async (manager) => {
      // Lock sender wallet and check balance
      const sender = await manager
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .where('wallet.id = :id', { id: senderWallet.id })
        .setLock('pessimistic_write')
        .getOne();

      if (!sender) {
        throw new NotFoundException('Sender wallet not found');
      }

      if (Number(sender.balance) < transferDto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct from sender
      sender.balance = Number(sender.balance) - transferDto.amount;
      await manager.save(sender);

      // Credit recipient
      recipientWallet.balance =
        Number(recipientWallet.balance) + transferDto.amount;
      await manager.save(recipientWallet);

      // Record transactions
      const transferOut = manager.getRepository(Transaction).create({
        walletId: sender.id,
        type: TransactionType.TRANSFER_OUT,
        amount: transferDto.amount,
        status: TransactionStatus.SUCCESS,
        recipientWalletId: recipientWallet.id,
      });
      await manager.save(transferOut);

      const transferIn = manager.getRepository(Transaction).create({
        walletId: recipientWallet.id,
        type: TransactionType.TRANSFER_IN,
        amount: transferDto.amount,
        status: TransactionStatus.SUCCESS,
        metadata: { senderWalletId: sender.id },
      });
      await manager.save(transferIn);
    });

    return {
      status: 'success',
      message: 'Transfer completed',
    };
  }

  async getTransactionHistory(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transactions = await this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      relations: ['recipientWallet'],
    });

    return transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      status: tx.status,
      recipient_wallet_number: tx.recipientWallet?.walletNumber,
      created_at: tx.createdAt,
    }));
  }
}
