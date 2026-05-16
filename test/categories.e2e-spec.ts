import { INestApplication } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as request from 'supertest';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { UserRole } from '../src/modules/users/schemas/users.schema';
import { CategoriesResolver } from '../src/modules/categories/categories.resolver';
import { CategoriesService } from '../src/modules/categories/categories.service';

describe('CategoriesResolver (e2e)', () => {
  let app: INestApplication;
  let currentRole: UserRole;

  const categoriesService = {
    create: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    currentRole = UserRole.ADMINISTRADOR;
    jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockReturnValue(true);
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
        CategoriesResolver,
        RolesGuard,
        {
          provide: CategoriesService,
          useValue: categoriesService,
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

  it('consulta categories', async () => {
    categoriesService.findAll.mockResolvedValue([
      { id: 'cat-1', name: 'Ropa', slug: 'ropa' },
    ]);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          query {
            categories {
              id
              name
              slug
            }
          }
        `,
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.categories).toEqual([
      { id: 'cat-1', name: 'Ropa', slug: 'ropa' },
    ]);
  });

  it('ejecuta createCategory', async () => {
    categoriesService.create.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
      parentId: null,
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateCategory($input: CreateCategoryInput!) {
            createCategory(input: $input) {
              id
              name
              slug
            }
          }
        `,
        variables: {
          input: {
            name: 'Ropa',
            slug: 'ropa',
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createCategory).toMatchObject({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });
  });

  it('ejecuta updateCategory', async () => {
    categoriesService.update.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa infantil',
      slug: 'ropa-infantil',
    });

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation UpdateCategory($id: String!, $input: UpdateCategoryInput!) {
            updateCategory(id: $id, input: $input) {
              id
              name
              slug
            }
          }
        `,
        variables: {
          id: 'cat-1',
          input: {
            name: 'Ropa infantil',
            slug: 'ropa-infantil',
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateCategory.slug).toBe('ropa-infantil');
  });

  it('bloquea createCategory para cliente', async () => {
    currentRole = UserRole.CLIENTE;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation CreateCategory($input: CreateCategoryInput!) {
            createCategory(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: {
            name: 'Ropa',
            slug: 'ropa',
          },
        },
      })
      .expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toMatch(/forbidden|denied/i);
    expect(categoriesService.create).not.toHaveBeenCalled();
  });
});
