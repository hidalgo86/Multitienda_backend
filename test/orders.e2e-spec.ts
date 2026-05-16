import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as request from 'supertest';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { OrdersResolver } from '../src/modules/orders/orders.resolver';
import { OrdersService } from '../src/modules/orders/orders.service';
import {
  OrderStatus,
  PaymentMethod,
} from '../src/modules/orders/schemas/orders.schema';

describe('OrdersResolver (e2e)', () => {
  let app: INestApplication;

  const ordersService = {
    myOrders: jest.fn(),
    getMyOrderById: jest.fn(),
    checkout: jest.fn(),
    payOrder: jest.fn(),
    cancelOrder: jest.fn(),
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
        OrdersResolver,
        {
          provide: OrdersService,
          useValue: ordersService,
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

  it('consulta una orden puntual del usuario autenticado', async () => {
    ordersService.getMyOrderById.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [],
      totalAmount: 29,
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.MANUAL,
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query GetMyOrder($orderId: String!) {
            myOrder(orderId: $orderId) {
              id
              userId
              totalAmount
              status
              paymentMethod
            }
          }
        `,
        variables: {
          orderId: '507f191e810c19729de860ec',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myOrder.status).toBe('PENDING');
    expect(ordersService.getMyOrderById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ec',
    );
  });

  it('ejecuta payMyOrder con trazabilidad de pago', async () => {
    ordersService.payOrder.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [],
      totalAmount: 29,
      status: OrderStatus.PAID,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: 'pay_test_123',
      paidAt: new Date('2026-04-21T12:00:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation PayMyOrder($orderId: String!) {
            payMyOrder(orderId: $orderId) {
              id
              status
              paymentMethod
              paymentReference
              paidAt
            }
          }
        `,
        variables: {
          orderId: '507f191e810c19729de860ec',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.payMyOrder.status).toBe('PAID');
    expect(response.body.data.payMyOrder.paymentReference).toBe('pay_test_123');
    expect(ordersService.payOrder).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ec',
    );
  });

  it('ejecuta cancelMyOrder y expone cancelledAt', async () => {
    ordersService.cancelOrder.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [],
      totalAmount: 29,
      status: OrderStatus.CANCELLED,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: 'pay_test_123',
      cancelledAt: new Date('2026-04-21T12:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CancelMyOrder($orderId: String!) {
            cancelMyOrder(orderId: $orderId) {
              id
              status
              paymentReference
              cancelledAt
            }
          }
        `,
        variables: {
          orderId: '507f191e810c19729de860ec',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.cancelMyOrder.status).toBe('CANCELLED');
    expect(response.body.data.cancelMyOrder.cancelledAt).toBeDefined();
    expect(ordersService.cancelOrder).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ec',
    );
  });
});
