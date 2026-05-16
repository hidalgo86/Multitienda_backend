import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { CreateProductService } from '../../application/create-product.service';
import { ProductsRepository } from '../../products.repository';
import { Category } from '@/modules/categories/schemas/category.schema';

describe('CreateProductService', () => {
  let service: CreateProductService;

  const productsRepositoryMock = {
    skuExists: jest.fn(),
    slugExists: jest.fn(),
    create: jest.fn(),
  };

  const categoryModelMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductService,
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
        {
          provide: getModelToken(Category.name),
          useValue: categoryModelMock,
        },
      ],
    }).compile();

    service = module.get<CreateProductService>(CreateProductService);
    jest.clearAllMocks();
  });

  it('crea un producto simple con sku y slug unicos', async () => {
    categoryModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        id: 'cat-1',
        name: 'Ropa',
        slug: 'ropa',
      }),
    });
    productsRepositoryMock.skuExists.mockResolvedValue(false);
    productsRepositoryMock.slugExists.mockResolvedValue(false);
    productsRepositoryMock.create.mockImplementation((input) => ({
      id: 'product-1',
      ...input,
    }));

    const result = await service.execute({
      categoryId: '507f1f77bcf86cd799439012',
      name: 'Body Bebé',
      description: 'Algodón',
      stock: 10,
      price: 19.99,
    });

    expect(productsRepositoryMock.create).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 'product-1',
      name: 'Body Bebé',
      stock: 10,
      price: 19.99,
    });
  });

  it('crea un producto con variantes normalizadas', async () => {
    categoryModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        id: 'cat-1',
        name: 'Ropa',
        slug: 'ropa',
      }),
    });
    productsRepositoryMock.skuExists.mockResolvedValue(false);
    productsRepositoryMock.slugExists.mockResolvedValue(false);
    productsRepositoryMock.create.mockImplementation((input) => ({
      id: 'product-1',
      ...input,
    }));

    const result = await service.execute({
      categoryId: '507f1f77bcf86cd799439012',
      name: 'Pijama',
      variants: [
        { name: ' RN ', stock: 5, price: 20 },
        { name: 'M3', stock: 4, price: 22 },
      ],
    });

    expect(result.variants).toEqual([
      { name: 'RN', stock: 5, price: 20, image: undefined },
      { name: 'M3', stock: 4, price: 22, image: undefined },
    ]);
  });

  it('rechaza categoria inexistente', async () => {
    categoryModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.execute({
        categoryId: '507f1f77bcf86cd799439012',
        name: 'Body Bebé',
        stock: 10,
        price: 19.99,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza nombres de variantes duplicados', async () => {
    categoryModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        id: 'cat-1',
        name: 'Ropa',
        slug: 'ropa',
      }),
    });
    productsRepositoryMock.skuExists.mockResolvedValue(false);
    productsRepositoryMock.slugExists.mockResolvedValue(false);

    await expect(
      service.execute({
        categoryId: '507f1f77bcf86cd799439012',
        name: 'Pijama',
        variants: [
          { name: 'RN', stock: 5, price: 20 },
          { name: 'rn', stock: 4, price: 22 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
