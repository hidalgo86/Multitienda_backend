import { Test, TestingModule } from '@nestjs/testing';
import { FindProductsService } from '../../application/find-products.service';
import { ProductsRepository } from '../../products.repository';

describe('FindProductsService', () => {
  let service: FindProductsService;

  const productsRepositoryMock = {
    findWithFiltersQueryModel: jest.fn(),
    incrementSearches: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindProductsService,
        {
          provide: ProductsRepository,
          useValue: productsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<FindProductsService>(FindProductsService);
    jest.clearAllMocks();
  });

  it('lista productos con query model valido', async () => {
    productsRepositoryMock.findWithFiltersQueryModel.mockResolvedValue({
      items: [{ id: 'product-1', name: 'Body Bebe' }],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    productsRepositoryMock.incrementSearches.mockResolvedValue(undefined);

    const result = await service.execute({
      filters: { name: 'Body' },
      pagination: { page: 1, limit: 10 },
    });

    expect(productsRepositoryMock.findWithFiltersQueryModel).toHaveBeenCalled();
    expect(productsRepositoryMock.incrementSearches).toHaveBeenCalledWith(
      'product-1',
    );
    expect(result.total).toBe(1);
  });

  it('no incrementa searches cuando no hay texto de busqueda', async () => {
    productsRepositoryMock.findWithFiltersQueryModel.mockResolvedValue({
      items: [{ id: 'product-1', name: 'Body Bebe' }],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    await service.execute({
      filters: {},
      pagination: { page: 1, limit: 10 },
    });

    expect(productsRepositoryMock.incrementSearches).not.toHaveBeenCalled();
  });

  it('no rompe el listado si falla el tracking de searches', async () => {
    productsRepositoryMock.findWithFiltersQueryModel.mockResolvedValue({
      items: [{ id: 'product-1', name: 'Body Bebe' }],
      total: 1,
      page: 1,
      totalPages: 1,
    });
    productsRepositoryMock.incrementSearches.mockRejectedValue(
      new Error('tracking failed'),
    );

    const result = await service.execute({
      filters: { name: 'Body' },
      pagination: { page: 1, limit: 10 },
    });

    expect(result.total).toBe(1);
    expect(productsRepositoryMock.incrementSearches).toHaveBeenCalledWith(
      'product-1',
    );
  });

  it('rechaza minPrice negativo', async () => {
    await expect(
      service.execute({
        filters: { minPrice: -1 },
        pagination: { page: 1, limit: 10 },
      }),
    ).rejects.toThrow(/precio minimo no puede ser negativo|precio m[ií]nimo/i);
  });

  it('rechaza maxPrice negativo', async () => {
    await expect(
      service.execute({
        filters: { maxPrice: -1 },
        pagination: { page: 1, limit: 10 },
      }),
    ).rejects.toThrow(/precio maximo no puede ser negativo|precio m[aá]ximo/i);
  });

  it('rechaza cuando minPrice es mayor que maxPrice', async () => {
    await expect(
      service.execute({
        filters: { minPrice: 100, maxPrice: 50 },
        pagination: { page: 1, limit: 10 },
      }),
    ).rejects.toThrow(
      /precio minimo no puede ser mayor que el maximo|precio m[ií]nimo/i,
    );
  });
});
