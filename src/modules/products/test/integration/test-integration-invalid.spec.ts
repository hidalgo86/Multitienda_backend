import { INestApplication } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as request from 'supertest';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UserRole } from '@/modules/users/schemas/users.schema';
import '../../dto/enums.graphql';
import { ProductsResolver } from '../../products.resolver';
import { ProductsFacade } from '../../products.facade';

describe('Products Integration - Invalid Filters', () => {
  let app: INestApplication;
  let currentRole: UserRole;

  const productsFacade = {
    createProduct: jest.fn(),
    findById: jest.fn(),
    findProducts: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    restoreProduct: jest.fn(),
  };

  beforeAll(async () => {
    currentRole = UserRole.ADMINISTRADOR;
    jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockReturnValue(true as never);
    jest
      .spyOn(RolesGuard.prototype, 'canActivate')
      .mockImplementation((context: ExecutionContext) => {
        const gqlCtx = GqlExecutionContext.create(context);
        const req = gqlCtx.getContext<{
          req?: { user?: { role?: UserRole } };
        }>().req;
        return req?.user?.role === UserRole.ADMINISTRADOR;
      });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          context: ({ req, res }) => ({ req, res }),
        }),
      ],
      providers: [
        ProductsResolver,
        RolesGuard,
        {
          provide: ProductsFacade,
          useValue: productsFacade,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(
      (req: { user?: { userId: string; role: UserRole } }, _res, next) => {
        req.user = {
          userId: '507f1f77bcf86cd799439011',
          role: currentRole,
        };
        next();
      },
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentRole = UserRole.ADMINISTRADOR;
  });

  it('falla al crear un producto con datos invalidos de GraphQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateProduct($input: CreateProductInput!) {
            createProduct(input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          input: {
            categoryId: '507f1f77bcf86cd799439012',
            name: '',
            variants: [{ name: 'RN', stock: 10, price: -5 }],
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
  });

  it('propaga error al actualizar producto invalido', async () => {
    productsFacade.updateProduct.mockRejectedValue(
      new Error('Producto no encontrado'),
    );

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
            updateProduct(id: $id, input: $input) {
              id
              name
            }
          }
        `,
        variables: {
          id: 'id-invalido',
          input: {
            name: 'Inválido',
          },
        },
      })
      .expect(200);

    expect(response.body.errors[0].message).toMatch(/Producto no encontrado/i);
  });

  it('propaga error al eliminar con id invalido', async () => {
    productsFacade.deleteProduct.mockRejectedValue(
      new Error('ID de producto inválido'),
    );

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation DeleteProduct($id: String!) {
            deleteProduct(id: $id) {
              id
            }
          }
        `,
        variables: {
          id: 'id-invalido',
        },
      })
      .expect(200);

    expect(response.body.errors[0].message).toMatch(/inválido|invalido/i);
  });

  it('propaga error cuando minPrice es negativo', async () => {
    productsFacade.findProducts.mockRejectedValue(
      new Error('El precio mínimo no puede ser negativo'),
    );

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query Products($input: ProductsQueryInput) {
            products(input: $input) {
              items { id name }
            }
          }
        `,
        variables: {
          input: {
            filters: { minPrice: -10 },
            pagination: { page: 1, limit: 10 },
          },
        },
      })
      .expect(200);

    expect(response.body.errors[0].message).toMatch(
      /precio mínimo no puede ser negativo|precio m[ií]nimo/i,
    );
  });

  it('propaga error cuando maxPrice es negativo', async () => {
    productsFacade.findProducts.mockRejectedValue(
      new Error('El precio máximo no puede ser negativo'),
    );

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query Products($input: ProductsQueryInput) {
            products(input: $input) {
              items { id name }
            }
          }
        `,
        variables: {
          input: {
            filters: { maxPrice: -50 },
            pagination: { page: 1, limit: 10 },
          },
        },
      })
      .expect(200);

    expect(response.body.errors[0].message).toMatch(
      /precio máximo no puede ser negativo|precio m[aá]ximo/i,
    );
  });

  it('propaga error cuando minPrice es mayor que maxPrice', async () => {
    productsFacade.findProducts.mockRejectedValue(
      new Error('El precio mínimo no puede ser mayor que el máximo'),
    );

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query Products($input: ProductsQueryInput) {
            products(input: $input) {
              items { id name }
            }
          }
        `,
        variables: {
          input: {
            filters: { minPrice: 100, maxPrice: 50 },
            pagination: { page: 1, limit: 10 },
          },
        },
      })
      .expect(200);

    expect(response.body.errors[0].message).toMatch(
      /precio mínimo no puede ser mayor que el máximo|precio m[ií]nimo/i,
    );
  });
});
