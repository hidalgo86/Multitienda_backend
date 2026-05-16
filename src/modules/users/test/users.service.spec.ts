import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { UserRole, UserStatus } from '../schemas/users.schema';

describe('UsersService', () => {
  let service: UsersService;

  const baseUser = {
    id: '507f1f77bcf86cd799439011',
    username: 'carlos',
    email: 'carlos@example.com',
    password: 'Password%1234',
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
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const createDocument = (overrides: Partial<typeof baseUser> = {}) => {
    const data = { ...baseUser, ...overrides };

    return {
      ...data,
      _id: data.id,
      toObject: jest.fn(() => ({ ...data })),
    };
  };

  const usersRepositoryMock = {
    createUser: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findWithFilters: jest.fn(),
    findAllDeleted: jest.fn(),
    updateField: jest.fn(),
    softDeleteUser: jest.fn(),
    deleteUser: jest.fn(),
    restoreStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('crea un usuario', async () => {
    usersRepositoryMock.createUser.mockResolvedValue(createDocument());

    const user = await service.createUser({
      username: '  carlos  ',
      email: '  CARLOS@example.com  ',
      password: 'Password%1234',
    });

    expect(usersRepositoryMock.createUser).toHaveBeenCalledWith({
      username: 'carlos',
      usernameNormalized: 'carlos',
      email: 'carlos@example.com',
      password: 'Password%1234',
    });
    expect(user).toMatchObject({
      id: baseUser.id,
      username: 'carlos',
      email: 'carlos@example.com',
      status: UserStatus.ACTIVO,
    });
  });

  it('consulta usuario por id', async () => {
    usersRepositoryMock.findById.mockResolvedValue(createDocument());

    const user = await service.getUserById(baseUser.id);

    expect(usersRepositoryMock.findById).toHaveBeenCalledWith(baseUser.id);
    expect(user.id).toBe(baseUser.id);
  });

  it('consulta usuario por email', async () => {
    usersRepositoryMock.findByEmail.mockResolvedValue(createDocument());

    const user = await service.getUserByEmail('  CARLOS@example.com  ');

    expect(usersRepositoryMock.findByEmail).toHaveBeenCalledWith(
      baseUser.email,
    );
    expect(user.email).toBe(baseUser.email);
  });

  it('consulta usuario por username', async () => {
    usersRepositoryMock.findByUsername.mockResolvedValue(createDocument());

    const user = await service.getUserByUsername('  CARLOS  ');

    expect(usersRepositoryMock.findByUsername).toHaveBeenCalledWith('carlos');
    expect(user.username).toBe(baseUser.username);
  });

  it('soft delete cambia status a eliminado', async () => {
    usersRepositoryMock.softDeleteUser.mockResolvedValue(
      createDocument({ status: UserStatus.ELIMINADO }),
    );

    const user = await service.softDeleteUser(baseUser.id);

    expect(usersRepositoryMock.softDeleteUser).toHaveBeenCalledWith(
      baseUser.id,
    );
    expect(user.status).toBe(UserStatus.ELIMINADO);
  });

  it('restore vuelve status a activo', async () => {
    usersRepositoryMock.restoreStatus.mockResolvedValue(
      createDocument({ status: UserStatus.ACTIVO }),
    );

    const user = await service.restoreUser(baseUser.id);

    expect(usersRepositoryMock.restoreStatus).toHaveBeenCalledWith(baseUser.id);
    expect(user.status).toBe(UserStatus.ACTIVO);
  });

  it('lanza not found al consultar un usuario inexistente', async () => {
    usersRepositoryMock.findById.mockResolvedValue(null);

    await expect(service.getUserById(baseUser.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
