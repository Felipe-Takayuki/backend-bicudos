import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { AuthRepository } from '../src/modules/auth/repositories/auth.repository';
import { ConflictError, UnauthorizedError } from '../src/core/errors/app-error';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

describe('AuthService Business Logic', () => {
  let authRepository: AuthRepository;
  let authService: AuthService;

  beforeEach(() => {
    authRepository = new AuthRepository();
    authService = new AuthService(authRepository);
    vi.clearAllMocks();
  });

  it('should register a new user successfully with hashed password', async () => {
    const input = {
      name: 'Dra. Renata',
      email: 'renata@fazenda.com.br',
      password: 'SenhaForte123',
      role: Role.AGRONOMIST,
    };

    vi.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
    vi.spyOn(authRepository, 'create').mockImplementation(async (data: any) => ({
      id: 'uuid-user-1',
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'rt-1',
      token: 'refresh-token-123',
      userId: 'uuid-user-1',
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
    });

    const result = await authService.register(input);

    expect(result.user.email).toBe(input.email);
    expect(result.user.name).toBe(input.name);
    expect(result.user.role).toBe(Role.AGRONOMIST);
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    // A senha original nunca deve ser retornada
    expect((result.user as any).password).toBeUndefined();
  });

  it('should throw ConflictError if user email already exists', async () => {
    vi.spyOn(authRepository, 'findByEmail').mockResolvedValue({
      id: 'existing-id',
      name: 'Existing',
      email: 'renata@fazenda.com.br',
      password: 'hashed',
      role: Role.OPERATOR,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.register({
        name: 'Dra. Renata',
        email: 'renata@fazenda.com.br',
        password: 'SenhaForte123',
        role: Role.OPERATOR,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should throw UnauthorizedError on invalid password during login', async () => {
    const hashedPassword = await bcrypt.hash('SenhaCorreta123', 10);

    vi.spyOn(authRepository, 'findByEmail').mockResolvedValue({
      id: 'uuid-1',
      name: 'Dra. Renata',
      email: 'renata@fazenda.com.br',
      password: hashedPassword,
      role: Role.AGRONOMIST,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.login({
        email: 'renata@fazenda.com.br',
        password: 'SenhaErrada123',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should login successfully with correct password', async () => {
    const hashedPassword = await bcrypt.hash('SenhaCorreta123', 10);

    vi.spyOn(authRepository, 'findByEmail').mockResolvedValue({
      id: 'uuid-1',
      name: 'Dra. Renata',
      email: 'renata@fazenda.com.br',
      password: hashedPassword,
      role: Role.AGRONOMIST,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.spyOn(authRepository, 'createRefreshToken').mockResolvedValue({
      id: 'rt-1',
      token: 'valid-refresh-token',
      userId: 'uuid-1',
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
    });

    const result = await authService.login({
      email: 'renata@fazenda.com.br',
      password: 'SenhaCorreta123',
    });

    expect(result.user.id).toBe('uuid-1');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });
});
