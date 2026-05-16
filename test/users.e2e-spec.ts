import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as request from 'supertest';
import '../src/modules/users/dto/enums.graphql';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { UsersResolver } from '../src/modules/users/users.resolver';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersResolver (e2e)', () => {
  let app: INestApplication;

  const usersService = {
    getUserById: jest.fn(),
    updateUserProfile: jest.fn(),
  };

  beforeAll(async () => {
    jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation(() => true);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req, res }) => ({ req, res }),
        }),
      ],
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: usersService,
        },
        JwtAuthGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use((req: { user?: { userId: string } }, _res, next) => {
      req.user = { userId: '507f1f77bcf86cd799439011' };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consulta me con el usuario autenticado', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'carlos',
      email: 'carlos@example.com',
      isEmailVerified: true,
      status: 'activo',
      role: 'cliente',
      name: 'Carlos',
      phone: '600000000',
      address: 'Madrid',
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            me {
              id
              username
              email
              status
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(usersService.getUserById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
    expect(response.body.data.me).toMatchObject({
      id: '507f1f77bcf86cd799439011',
      username: 'carlos',
      email: 'carlos@example.com',
      status: 'activo',
    });
  });

  it('ejecuta updateMyProfile con el usuario autenticado', async () => {
    usersService.updateUserProfile.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'carlos',
      email: 'carlos@example.com',
      isEmailVerified: true,
      status: 'activo',
      role: 'cliente',
      name: 'Carlos Actualizado',
      phone: '611111111',
      address: 'Barcelona',
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation UpdateMyProfile($input: UpdateProfileInput!) {
            updateMyProfile(input: $input) {
              id
              name
              phone
              address
            }
          }
        `,
        variables: {
          input: {
            name: 'Carlos Actualizado',
            phone: '611111111',
            address: 'Barcelona',
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(usersService.updateUserProfile).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      name: 'Carlos Actualizado',
      phone: '611111111',
      address: 'Barcelona',
    });
    expect(response.body.data.updateMyProfile).toMatchObject({
      id: '507f1f77bcf86cd799439011',
      name: 'Carlos Actualizado',
      phone: '611111111',
      address: 'Barcelona',
    });
  });
});
