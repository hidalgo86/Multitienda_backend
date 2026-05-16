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

describe('Products Integration Tests', () => {
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

  it('crea un producto via GraphQL mutation', async () => {
    productsFacade.createProduct.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'test-product',
      categoryId: '507f1f77bcf86cd799439012',
      name: 'Test Product',
      genre: 'niña',
      description: 'A product for testing',
      variants: [
        { name: 'RN', stock: 10, price: 29.99 },
        { name: 'M3', stock: 5, price: 34.99 },
      ],
      state: 'activo',
      availability: 'disponible',
      stats: {
        views: 0,
        favorites: 0,
        cartAdds: 0,
        purchases: 0,
        searches: 0,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateProduct($input: CreateProductInput!) {
            createProduct(input: $input) {
              id
              name
              state
              availability
              variants { name stock price }
            }
          }
        `,
        variables: {
          input: {
            categoryId: '507f1f77bcf86cd799439012',
            name: 'Test Product',
            genre: 'NINA',
            description: 'A product for testing',
            variants: [
              { name: 'RN', stock: 10, price: 29.99 },
              { name: 'M3', stock: 5, price: 34.99 },
            ],
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createProduct).toMatchObject({
      id: 'product-1',
      state: 'ACTIVO',
      availability: 'DISPONIBLE',
    });
  });

  it('actualiza el producto y verifica cambios', async () => {
    productsFacade.updateProduct.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'updated-product',
      categoryId: '507f1f77bcf86cd799439012',
      name: 'Updated Product',
      description: 'Updated description',
      variants: [
        { name: 'T6', stock: 20, price: 39.99 },
        { name: 'M6', stock: 10, price: 44.99 },
      ],
      state: 'ACTIVO',
      availability: 'DISPONIBLE',
      stats: {
        views: 0,
        favorites: 0,
        cartAdds: 0,
        purchases: 0,
        searches: 0,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
            updateProduct(id: $id, input: $input) {
              id
              name
              description
              variants { name stock price }
            }
          }
        `,
        variables: {
          id: 'product-1',
          input: {
            name: 'Updated Product',
            description: 'Updated description',
            variants: [
              { name: 'T6', stock: 20, price: 39.99 },
              { name: 'M6', stock: 10, price: 44.99 },
            ],
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateProduct).toMatchObject({
      name: 'Updated Product',
      description: 'Updated description',
    });
  });

  it('consulta un producto por id', async () => {
    productsFacade.findById.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'updated-product',
      categoryId: '507f1f77bcf86cd799439012',
      name: 'Updated Product',
      description: 'Updated description',
      genre: 'niña',
      variants: [{ name: 'T6', stock: 20, price: 39.99 }],
      state: 'eliminado',
      availability: 'disponible',
      stats: {
        views: 1,
        favorites: 0,
        cartAdds: 0,
        purchases: 0,
        searches: 0,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query Product($id: String!) {
            product(id: $id) {
              id
              name
              state
              variants { name stock price }
            }
          }
        `,
        variables: {
          id: 'product-1',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.product.id).toBe('product-1');
  });

  it('consulta productos paginados', async () => {
    productsFacade.findProducts.mockResolvedValue({
      items: [
        {
          id: 'product-1',
          sku: 'ROP-ABC123',
          slug: 'updated-product',
          categoryId: '507f1f77bcf86cd799439012',
          name: 'Updated Product',
          description: 'Updated description',
          genre: 'niña',
          variants: [{ name: 'T6', stock: 20, price: 39.99 }],
          state: 'eliminado',
          availability: 'disponible',
          stats: {
            views: 1,
            favorites: 0,
            cartAdds: 0,
            purchases: 0,
            searches: 0,
          },
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query Products($input: ProductsQueryInput) {
            products(input: $input) {
              items { id name genre state variants { name price } }
              total
              page
              totalPages
            }
          }
        `,
        variables: {
          input: {
            filters: {
              name: 'Updated',
              genre: 'NINA',
              variantNames: ['T6'],
              state: 'ELIMINADO',
              minPrice: 10,
              maxPrice: 50,
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.products).toMatchObject({
      total: 1,
      page: 1,
      totalPages: 1,
    });
  });

  it('soft delete mantiene el producto en estado eliminado', async () => {
    productsFacade.deleteProduct.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'updated-product',
      categoryId: '507f1f77bcf86cd799439012',
      name: 'Updated Product',
      state: 'eliminado',
      availability: 'disponible',
      stats: {
        views: 1,
        favorites: 0,
        cartAdds: 0,
        purchases: 0,
        searches: 0,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation DeleteProduct($id: String!) {
            deleteProduct(id: $id) {
              id
              state
            }
          }
        `,
        variables: {
          id: 'product-1',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.deleteProduct).toMatchObject({
      id: 'product-1',
      state: 'ELIMINADO',
    });
  });

  it('bloquea createProduct para cliente', async () => {
    currentRole = UserRole.CLIENTE;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateProduct($input: CreateProductInput!) {
            createProduct(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            categoryId: '507f1f77bcf86cd799439012',
            name: 'Producto bloqueado',
            price: 10,
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toMatch(/forbidden|denied/i);
    expect(productsFacade.createProduct).not.toHaveBeenCalled();
  });
});
