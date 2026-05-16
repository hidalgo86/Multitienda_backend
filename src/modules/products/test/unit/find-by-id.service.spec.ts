import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@/modules/users/schemas/users.schema';
import { FindByIdService } from '../../application/find-by-id.service';
import { ProductsRepository } from '../../products.repository';

describe('FindByIdService', () => {
  let service: FindByIdService;

  const productsRepositoryMock = {
    findById: jest.fn(),
    incrementViews: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindByIdService,
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<FindByIdService>(FindByIdService);
    jest.clearAllMocks();
  });

  it('devuelve el producto e incrementa views para trafico publico o cliente', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      name: 'Body Bebe',
    });
    productsRepositoryMock.incrementViews.mockResolvedValue(undefined);

    const result = await service.execute('product-1', {
      role: UserRole.CLIENTE,
    });

    expect(productsRepositoryMock.findById).toHaveBeenCalledWith('product-1');
    expect(productsRepositoryMock.incrementViews).toHaveBeenCalledWith(
      'product-1',
    );
    expect(result).toMatchObject({
      id: 'product-1',
      name: 'Body Bebe',
    });
  });

  it('no incrementa views cuando la lectura es de administrador', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      name: 'Body Bebe',
    });

    const result = await service.execute('product-1', {
      role: UserRole.ADMINISTRADOR,
    });

    expect(result.id).toBe('product-1');
    expect(productsRepositoryMock.incrementViews).not.toHaveBeenCalled();
  });

  it('no rompe si falla incrementViews', async () => {
    productsRepositoryMock.findById.mockResolvedValue({
      id: 'product-1',
      name: 'Body Bebe',
    });
    productsRepositoryMock.incrementViews.mockRejectedValue(
      new Error('analytics down'),
    );

    const result = await service.execute('product-1');

    expect(result.id).toBe('product-1');
  });

  it('lanza NotFound cuando el producto no existe', async () => {
    productsRepositoryMock.findById.mockResolvedValue(null);

    await expect(service.execute('product-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
