import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, Wallet } from '../../entities';

interface GoogleUserDto {
  googleId: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUserDto): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
      });
      user = await this.userRepository.save(user);

      // Create wallet for new user
      await this.createWalletForUser(user.id);
    }

    return user;
  }

  async createWalletForUser(userId: string): Promise<Wallet> {
    const walletNumber = this.generateWalletNumber();
    const wallet = this.walletRepository.create({
      userId,
      walletNumber,
      balance: 0,
    });
    return await this.walletRepository.save(wallet);
  }

  generateWalletNumber(): string {
    // Generate a 13-digit unique wallet number
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return (timestamp + random).slice(0, 13);
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
