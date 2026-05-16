import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateProductService } from '../../application/update-product.service';
import { ProductsRepository } from '../../products.repository';
import { Category } from '@/modules/categories/schemas/category.schema';

describe('UpdateProductService', () => {
  let service: UpdateProductService;

  const productsRepositoryMock = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const categoryModelMock = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductService,
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

    service = module.get<UpdateProductService>(UpdateProductService);
    jest.clearAllMocks();
  });

  it('actualiza un producto simple', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'body-bebe',
      stock: 10,
      price: 20,
      variants: undefined,
    });
    productsRepositoryMock.update.mockImplementation((_id, input) => ({
      id: 'product-1',
      ...input,
    }));

    const result = await service.execute('product-1', {
      name: 'Body actualizado',
      stock: 12,
      price: 21,
    });

    expect(productsRepositoryMock.update).toHaveBeenCalledWith('product-1', {
      name: 'Body actualizado',
      stock: 12,
      price: 21,
    });
    expect(result.name).toBe('Body actualizado');
  });

  it('rechaza actualizar un producto inexistente', async () => {
    productsRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      service.execute('product-1', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza cambiar el sku', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'body-bebe',
    });

    await expect(
      service.execute('product-1', {
        sku: 'ROP-XYZ999',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza stock general cuando hay variantes', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'body-bebe',
      variants: [{ name: 'RN', stock: 5, price: 20 }],
      stock: undefined,
      price: undefined,
    });

    await expect(
      service.execute('product-1', {
        stock: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('permite convertir un producto con variantes en producto simple', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'body-bebe',
      variants: [{ name: 'RN', stock: 5, price: 20 }],
      stock: undefined,
      price: undefined,
      genre: 'unisex',
    });
    productsRepositoryMock.update.mockImplementation((_id, input) => ({
      id: 'product-1',
      ...input,
    }));

    const result = await service.execute('product-1', {
      variants: [],
      genre: null,
      stock: 10,
      price: 15,
    });

    expect(productsRepositoryMock.update).toHaveBeenCalledWith('product-1', {
      variants: [],
      genre: undefined,
      stock: 10,
      price: 15,
    });
    expect(result.stock).toBe(10);
    expect(result.price).toBe(15);
  });

  it('permite convertir un producto simple en producto con variantes', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'body-bebe',
      variants: undefined,
      stock: 10,
      price: 20,
    });
    productsRepositoryMock.update.mockImplementation((_id, input) => ({
      id: 'product-1',
      ...input,
    }));

    const result = await service.execute('product-1', {
      variants: [{ name: 'RN', stock: 5, price: 22 }],
    });

    expect(productsRepositoryMock.update).toHaveBeenCalledWith('product-1', {
      variants: [{ name: 'RN', stock: 5, price: 22, image: undefined }],
      stock: undefined,
      price: undefined,
    });
    expect(result.variants).toEqual([
      { name: 'RN', stock: 5, price: 22, image: undefined },
    ]);
  });

  it('valida categoria cuando se envia categoryId', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      sku: 'ROP-ABC123',
      slug: 'body-bebe',
      variants: undefined,
      stock: 10,
      price: 20,
    });
    categoryModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        id: 'cat-1',
      }),
    });
    productsRepositoryMock.update.mockImplementation((_id, input) => ({
      id: 'product-1',
      ...input,
    }));

    const result = await service.execute('product-1', {
      categoryId: '507f1f77bcf86cd799439012',
    });

    expect(result.categoryId).toBe('507f1f77bcf86cd799439012');
  });
});
