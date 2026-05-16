import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories.service';
import { CategoriesRepository } from '../categories.repository';
import { ProductsRepository } from '@/modules/products/products.repository';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const categoriesRepositoryMock = {
    slugExists: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findBySlug: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const productsRepositoryMock = {
    countByCategoryId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: categoriesRepositoryMock,
        },
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  it('crea una categoria valida', async () => {
    categoriesRepositoryMock.slugExists.mockResolvedValue(false);
    categoriesRepositoryMock.create.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });

    const result = await service.create({
      name: 'Ropa',
      slug: 'ropa',
    });

    expect(result).toMatchObject({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });
  });

  it('rechaza slug duplicado al crear', async () => {
    categoriesRepositoryMock.slugExists.mockResolvedValue(true);

    await expect(
      service.create({
        name: 'Ropa',
        slug: 'ropa',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza parentId inexistente al crear', async () => {
    categoriesRepositoryMock.slugExists.mockResolvedValue(false);
    categoriesRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'Ropa bebé',
        slug: 'ropa-bebe',
        parentId: 'cat-parent',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('encuentra categoria por id', async () => {
    categoriesRepositoryMock.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });

    const result = await service.findById('cat-1');

    expect(result.id).toBe('cat-1');
  });

  it('lanza not found por id inexistente', async () => {
    categoriesRepositoryMock.findById.mockResolvedValue(null);

    await expect(service.findById('cat-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('actualiza categoria valida', async () => {
    categoriesRepositoryMock.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });
    categoriesRepositoryMock.slugExists.mockResolvedValue(false);
    categoriesRepositoryMock.update.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa infantil',
      slug: 'ropa-infantil',
    });

    const result = await service.update('cat-1', {
      name: 'Ropa infantil',
      slug: 'ropa-infantil',
    });

    expect(result.slug).toBe('ropa-infantil');
  });

  it('rechaza que una categoria sea su propia padre', async () => {
    categoriesRepositoryMock.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });

    await expect(
      service.update('cat-1', {
        parentId: 'cat-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('elimina categoria existente', async () => {
    categoriesRepositoryMock.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });
    productsRepositoryMock.countByCategoryId.mockResolvedValue(0);
    categoriesRepositoryMock.delete.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });

    const result = await service.delete('cat-1');

    expect(result.id).toBe('cat-1');
  });

  it('rechaza eliminar una categoria con productos asociados', async () => {
    categoriesRepositoryMock.findById.mockResolvedValue({
      id: 'cat-1',
      name: 'Ropa',
      slug: 'ropa',
    });
    productsRepositoryMock.countByCategoryId.mockResolvedValue(2);

    await expect(service.delete('cat-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(categoriesRepositoryMock.delete).not.toHaveBeenCalled();
  });
});
