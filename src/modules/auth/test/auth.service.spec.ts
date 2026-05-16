import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { EmailService } from '@/common/email/email.service';
import { UsersService } from '@/modules/users/users.service';
import { UserRole, UserStatus } from '@/modules/users/schemas/users.schema';
import { hashPassword } from '../utils/hash.util';
import { CartsService } from '@/modules/cart/carts.service';
import { FavoritesService } from '@/modules/favorites/favorites.service';

describe('AuthService', () => {
  let service: AuthService;

  const jwtServiceMock = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const emailServiceMock = {
    forgotUsername: jest.fn(),
    forgotPassword: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendAccountDeletionCode: jest.fn(),
  };

  const usersServiceMock = {
    getUserByEmail: jest.fn(),
    getUserByUsername: jest.fn(),
    createUser: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    getAuthUserByUsername: jest.fn(),
    getUserById: jest.fn(),
    getAuthUserById: jest.fn(),
    getAuthUserByEmail: jest.fn(),
    updateUserPassword: jest.fn(),
    markEmailAsVerified: jest.fn(),
    updateAuthVerificationState: jest.fn(),
    updatePasswordResetState: jest.fn(),
    resetPasswordCredentials: jest.fn(),
    updateAccountDeletionState: jest.fn(),
    recordFailedLoginAttempt: jest.fn(),
    resetFailedLoginAttempts: jest.fn(),
    deleteUser: jest.fn(),
  };

  const cartsServiceMock = {
    deleteByUserId: jest.fn(),
  };

  const favoritesServiceMock = {
    deleteByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: CartsService, useValue: cartsServiceMock },
        { provide: FavoritesService, useValue: favoritesServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('registra un usuario y envia el codigo por email', async () => {
    usersServiceMock.getUserByEmail.mockRejectedValue(
      new Error('Usuario no encontrado'),
    );
    usersServiceMock.getUserByUsername.mockRejectedValue(
      new Error('Usuario no encontrado'),
    );
    usersServiceMock.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'carlos@example.com',
      username: 'carlos',
    });
    emailServiceMock.sendVerificationEmail.mockResolvedValue(undefined);

    const result = await service.registerUser({
      username: 'carlos',
      email: 'carlos@example.com',
      password: 'Password%1234',
    });

    expect(usersServiceMock.createUser).toHaveBeenCalled();
    expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalled();
    expect(result).toMatchObject({
      message: 'Usuario registrado exitosamente',
    });
  });

  it('loguea un usuario y devuelve tokens', async () => {
    const hashedPassword = await hashPassword('Password%1234');

    usersServiceMock.getAuthUserByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: hashedPassword,
      role: UserRole.CLIENTE,
      isEmailVerified: false,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      lastVerificationSentAt: null,
      refreshTokenHash: null,
      status: UserStatus.ACTIVO,
      name: null,
      address: null,
      phone: null,
    });
    jwtServiceMock.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');
    usersServiceMock.updateRefreshTokenHash.mockResolvedValue({});
    usersServiceMock.getUserById.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      isEmailVerified: false,
      status: UserStatus.ACTIVO,
      failedLoginAttempts: 0,
      role: UserRole.CLIENTE,
    });

    const result = await service.login({
      username: 'carlos',
      password: 'Password%1234',
    });

    expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
    expect(usersServiceMock.updateRefreshTokenHash).toHaveBeenCalled();
    expect(result).toMatchObject({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'user-1',
      },
    });
  });

  it('rechaza login de usuario no activo', async () => {
    usersServiceMock.getAuthUserByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: await hashPassword('Password%1234'),
      role: UserRole.CLIENTE,
      isEmailVerified: false,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      lastVerificationSentAt: null,
      refreshTokenHash: null,
      status: UserStatus.SUSPENDIDO,
      name: null,
      address: null,
      phone: null,
    });

    await expect(
      service.login({
        username: 'carlos',
        password: 'Password%1234',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('registra intento fallido si la contrasena es incorrecta', async () => {
    usersServiceMock.getAuthUserByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: await hashPassword('Password%1234'),
      role: UserRole.CLIENTE,
      isEmailVerified: false,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      lastVerificationSentAt: null,
      refreshTokenHash: null,
      status: UserStatus.ACTIVO,
      failedLoginAttempts: 2,
      name: null,
      address: null,
      phone: null,
    });
    usersServiceMock.recordFailedLoginAttempt.mockResolvedValue({});

    await expect(
      service.login({
        username: 'carlos',
        password: 'incorrecta',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersServiceMock.recordFailedLoginAttempt).toHaveBeenCalledWith(
      'user-1',
      false,
    );
  });

  it('bloquea el usuario al superar 3 intentos incorrectos', async () => {
    usersServiceMock.getAuthUserByUsername.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: await hashPassword('Password%1234'),
      role: UserRole.CLIENTE,
      isEmailVerified: false,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      lastVerificationSentAt: null,
      refreshTokenHash: null,
      status: UserStatus.ACTIVO,
      failedLoginAttempts: 3,
      name: null,
      address: null,
      phone: null,
    });
    usersServiceMock.recordFailedLoginAttempt.mockResolvedValue({});

    await expect(
      service.login({
        username: 'carlos',
        password: 'incorrecta',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersServiceMock.recordFailedLoginAttempt).toHaveBeenCalledWith(
      'user-1',
      true,
    );
    expect(usersServiceMock.updateRefreshTokenHash).not.toHaveBeenCalled();
  });

  it('recupera username sin revelar ausencia de cuenta', async () => {
    usersServiceMock.getUserByEmail.mockRejectedValue(
      new Error('Usuario no encontrado'),
    );

    const result = await service.forgotUsername('nadie@example.com');

    expect(emailServiceMock.forgotUsername).not.toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Se ha enviado un correo de recuperación de nombre de usuario.',
    });
  });

  it('refresca tokens cuando el refresh token es valido', async () => {
    const hashedRefreshToken = await hashPassword('valid-refresh-token');

    jwtServiceMock.verify.mockReturnValue({
      sub: 'user-1',
      role: UserRole.CLIENTE,
    });
    usersServiceMock.getAuthUserById.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: await hashPassword('Password%1234'),
      role: UserRole.CLIENTE,
      isEmailVerified: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      lastVerificationSentAt: null,
      refreshTokenHash: hashedRefreshToken,
      status: UserStatus.ACTIVO,
      name: null,
      address: null,
      phone: null,
    });
    jwtServiceMock.sign
      .mockReturnValueOnce('new-access-token')
      .mockReturnValueOnce('new-refresh-token');
    usersServiceMock.updateRefreshTokenHash.mockResolvedValue({});

    const result = await service.refreshToken('valid-refresh-token');

    expect(result).toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });
  });

  it('verifica email con codigo correcto', async () => {
    const verificationCodeHash = await hashPassword('123456');
    usersServiceMock.getAuthUserById.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: 'hashed-password',
      role: UserRole.CLIENTE,
      isEmailVerified: false,
      verificationCodeHash,
      verificationCodeExpiresAt: new Date(Date.now() + 60_000),
      lastVerificationSentAt: null,
      refreshTokenHash: null,
      status: UserStatus.ACTIVO,
      name: null,
      address: null,
      phone: null,
    });
    usersServiceMock.markEmailAsVerified.mockResolvedValue({});

    const result = await service.verifyEmail({
      userId: 'user-1',
      code: '123456',
    });

    expect(usersServiceMock.markEmailAsVerified).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ message: 'Usuario verificado exitosamente' });
  });

  it('rechaza cambio de contraseña si la actual es incorrecta', async () => {
    usersServiceMock.getAuthUserById.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: await hashPassword('Password%1234'),
      role: UserRole.CLIENTE,
      isEmailVerified: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      lastVerificationSentAt: null,
      refreshTokenHash: null,
      status: UserStatus.ACTIVO,
      name: null,
      address: null,
      phone: null,
    });

    await expect(
      service.changePassword({
        userId: 'user-1',
        oldPassword: 'incorrecta',
        newPassword: 'NuevaPassword%1234',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza refresh token invalido', async () => {
    jwtServiceMock.verify.mockImplementation(() => {
      const error = new Error('JsonWebTokenError');
      error.name = 'JsonWebTokenError';
      throw error;
    });

    await expect(service.refreshToken('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('elimina la cuenta con codigo correcto', async () => {
    const deletionCodeHash = await hashPassword('123456');
    usersServiceMock.getAuthUserById.mockResolvedValue({
      id: 'user-1',
      username: 'carlos',
      email: 'carlos@example.com',
      password: 'hashed-password',
      role: UserRole.CLIENTE,
      isEmailVerified: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      lastVerificationSentAt: null,
      refreshTokenHash: null,
      accountDeletionCodeHash: deletionCodeHash,
      accountDeletionCodeExpiresAt: new Date(Date.now() + 60_000),
      lastAccountDeletionSentAt: new Date(),
      status: UserStatus.ACTIVO,
      name: null,
      address: null,
      phone: null,
    });
    favoritesServiceMock.deleteByUserId.mockResolvedValue(true);
    cartsServiceMock.deleteByUserId.mockResolvedValue(true);
    usersServiceMock.deleteUser.mockResolvedValue({});

    const result = await service.confirmAccountDeletion('user-1', '123456');

    expect(favoritesServiceMock.deleteByUserId).toHaveBeenCalledWith('user-1');
    expect(cartsServiceMock.deleteByUserId).toHaveBeenCalledWith('user-1');
    expect(usersServiceMock.deleteUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({ message: 'Cuenta eliminada definitivamente' });
  });
});
