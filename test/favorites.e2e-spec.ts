import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as request from 'supertest';
import '../src/modules/products/dto/enums.graphql';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { FavoritesResolver } from '../src/modules/favorites/favorites.resolver';
import { FavoritesService } from '../src/modules/favorites/favorites.service';

describe('FavoritesResolver (e2e)', () => {
  let app: INestApplication;

  const favoritesService = {
    getMyFavorites: jest.fn(),
    addProduct: jest.fn(),
    removeProduct: jest.fn(),
    toggleProduct: jest.fn(),
    clearMyFavorites: jest.fn(),
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
        FavoritesResolver,
        {
          provide: FavoritesService,
          useValue: favoritesService,
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

  it('consulta myFavorites con el usuario autenticado', async () => {
    favoritesService.getMyFavorites.mockResolvedValue({
      id: 'fav-1',
      userId: '507f1f77bcf86cd799439011',
      productIds: [],
      products: [],
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            myFavorites {
              id
              userId
              productIds
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myFavorites.id).toBe('fav-1');
  });

  it('ejecuta addToFavorites', async () => {
    favoritesService.addProduct.mockResolvedValue({
      id: 'fav-1',
      userId: '507f1f77bcf86cd799439011',
      productIds: ['507f191e810c19729de860ea'],
      products: [],
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation AddToFavorites($input: AddFavoriteInput!) {
            addToFavorites(input: $input) {
              id
              productIds
            }
          }
        `,
        variables: {
          input: {
            productId: '507f191e810c19729de860ea',
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.addToFavorites.productIds).toEqual([
      '507f191e810c19729de860ea',
    ]);
  });
});
