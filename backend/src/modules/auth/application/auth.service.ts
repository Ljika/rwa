import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}


  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email je već registrovan');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const accessToken = this.generateToken(savedUser);
    const refreshToken = this.generateRefreshToken(savedUser);

    const { password, ...userWithoutPassword } = savedUser;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }


  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Pogrešan email ili password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Pogrešan email ili password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Nalog je deaktiviran');
    }

    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }


  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Nevalidan token');
    }

    return user;
  }

 
  private generateToken(user: User): string {
    const payload = {
      sub: user.id, 
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
    };

    const jwt = require('jsonwebtoken');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiration });
  }

  async refreshToken(refreshToken: string) {
    try {
      const jwt = require('jsonwebtoken');
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      
      // Verifikuj refresh token
      const payload: any = jwt.verify(refreshToken, refreshSecret);

      // Učitaj user-a iz baze
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generiši NOVI access token
      const newAccessToken = this.generateToken(user);

      const { password, ...userWithoutPassword } = user;
      return {
        accessToken: newAccessToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }
}
