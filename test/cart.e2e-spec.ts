import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as request from 'supertest';
import '../src/modules/products/dto/enums.graphql';
import { CartsResolver } from '../src/modules/cart/carts.resolver';
import { CartsService } from '../src/modules/cart/carts.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

describe('CartResolver (e2e)', () => {
  let app: INestApplication;

  const cartsService = {
    getCartByUserId: jest.fn(),
    createCart: jest.fn(),
    addToCart: jest.fn(),
    clearCart: jest.fn(),
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
        CartsResolver,
        {
          provide: CartsService,
          useValue: cartsService,
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

  it('consulta myCart con el usuario autenticado', async () => {
    cartsService.getCartByUserId.mockResolvedValue({
      id: 'cart-1',
      userId: '507f1f77bcf86cd799439011',
      items: [],
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            myCart {
              id
              userId
              items {
                productId
                quantity
              }
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myCart.id).toBe('cart-1');
    expect(cartsService.getCartByUserId).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('ejecuta addToMyCart con variante y snapshot', async () => {
    cartsService.addToCart.mockResolvedValue({
      id: 'cart-1',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
          snapshot: {
            productName: 'Camiseta reciclada',
            variantName: 'XL',
            thumbnail: 'https://img.test/xl.jpg',
            unitPrice: 19.99,
          },
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation AddToMyCart($input: AddToCartInput!) {
            addToMyCart(input: $input) {
              id
              items {
                productId
                variantName
                quantity
                snapshot {
                  productName
                  variantName
                  thumbnail
                  unitPrice
                }
              }
            }
          }
        `,
        variables: {
          input: {
            productId: '507f191e810c19729de860ea',
            variantName: 'XL',
            quantity: 2,
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.addToMyCart.items[0].variantName).toBe('XL');
    expect(response.body.data.addToMyCart.items[0].snapshot.unitPrice).toBe(
      19.99,
    );
    expect(cartsService.addToCart).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      {
        productId: '507f191e810c19729de860ea',
        variantName: 'XL',
        quantity: 2,
      },
    );
  });
});
