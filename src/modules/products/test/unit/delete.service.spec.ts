import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SoftDeleteProductService } from '../../application/delete.service';
import { ProductsRepository } from '../../products.repository';
import { ProductState } from '../../schemas/products.schema';

describe('SoftDeleteProductService', () => {
  let service: SoftDeleteProductService;

  const productsRepositoryMock = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftDeleteProductService,
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<SoftDeleteProductService>(SoftDeleteProductService);
    jest.clearAllMocks();
  });

  it('marca el producto como eliminado', async () => {
    productsRepositoryMock.update.mockResolvedValue({
      id: 'product-1',
      state: ProductState.ELIMINADO,
    });

    const result = await service.execute('product-1');

    expect(productsRepositoryMock.update).toHaveBeenCalledWith('product-1', {
      state: ProductState.ELIMINADO,
    });
    expect(result.state).toBe(ProductState.ELIMINADO);
  });

  it('lanza NotFound cuando el producto no existe', async () => {
    productsRepositoryMock.update.mockResolvedValue(null);

    await expect(service.execute('product-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
