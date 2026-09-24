import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../config/env';
import { AuthRepository } from '../repositories/auth.repository';
import { RegisterInput, LoginInput, ChangePasswordInput } from '../schemas/auth.schema';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../../core/errors/app-error';
import { User, Role } from '@prisma/client';
import { UserPayload } from '../../../core/types/express';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResult {
  user: UserResponse;
  tokens: AuthTokens;
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository = new AuthRepository()) {}

  private sanitizeUser(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  private generateAccessToken(user: User): string {
    const payload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);

    await this.authRepository.createRefreshToken(userId, rawToken, expiresAt);
    return rawToken;
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.authRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Já existe uma conta cadastrada com este e-mail');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(input.password, saltRounds);

    const user = await this.authRepository.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      role: input.role,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: env.JWT_EXPIRES_IN,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(input.email);

    if (!user || !user.isActive) {
      // Mensagem genérica para prevenir enumeração de contas
      throw new UnauthorizedError('E-mail ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('E-mail ou senha incorretos', 'INVALID_CREDENTIALS');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: env.JWT_EXPIRES_IN,
      },
    };
  }

  async refreshToken(refreshTokenString: string): Promise<{ accessToken: string; expiresIn: string }> {
    const storedToken = await this.authRepository.findRefreshToken(refreshTokenString);

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token inválido ou já utilizado', 'INVALID_REFRESH_TOKEN');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.authRepository.deleteRefreshToken(refreshTokenString);
      throw new UnauthorizedError('Refresh token expirado. Faça login novamente.', 'EXPIRED_REFRESH_TOKEN');
    }

    const user = storedToken.user;
    if (!user.isActive) {
      throw new UnauthorizedError('Conta inativa', 'INACTIVE_ACCOUNT');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  async logout(refreshTokenString: string): Promise<void> {
    await this.authRepository.deleteRefreshToken(refreshTokenString);
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('A senha atual fornecida está incorreta', 'CURRENT_PASSWORD_MISMATCH');
    }

    const saltRounds = 12;
    const newHashed = await bcrypt.hash(input.newPassword, saltRounds);

    await this.authRepository.updatePassword(userId, newHashed);
    // Invalida todas as sessões anteriores para segurança
    await this.authRepository.deleteAllUserRefreshTokens(userId);
  }
}
