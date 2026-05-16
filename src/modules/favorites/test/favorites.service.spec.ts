import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsRepository } from '@/modules/products/products.repository';
import {
  ProductAvailability,
  ProductState,
} from '@/modules/products/schemas/products.schema';
import { UsersService } from '@/modules/users/users.service';
import { FavoritesRepository } from '../favorites.repository';
import { FavoritesService } from '../favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let favoritesRepository: {
    findByUserId: jest.Mock;
    findOrCreateByUserId: jest.Mock;
    addProduct: jest.Mock;
    removeProduct: jest.Mock;
    addProductAndReturn: jest.Mock;
    removeProductAndReturn: jest.Mock;
    replaceProductsByUserId: jest.Mock;
  };
  let usersService: {
    getUserById: jest.Mock;
  };
  let productsRepository: {
    findById: jest.Mock;
    incrementFavorites: jest.Mock;
    decrementFavorites: jest.Mock;
  };

  beforeEach(async () => {
    favoritesRepository = {
      findByUserId: jest.fn(),
      findOrCreateByUserId: jest.fn(),
      addProduct: jest.fn(),
      removeProduct: jest.fn(),
      addProductAndReturn: jest.fn(),
      removeProductAndReturn: jest.fn(),
      replaceProductsByUserId: jest.fn(),
    };
    usersService = {
      getUserById: jest.fn(),
    };
    productsRepository = {
      findById: jest.fn(),
      incrementFavorites: jest.fn(),
      decrementFavorites: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: FavoritesRepository, useValue: favoritesRepository },
        { provide: UsersService, useValue: usersService },
        { provide: ProductsRepository, useValue: productsRepository },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('crea favoritos vacios si no existe', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    favoritesRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'fav-1' },
      userId: '507f1f77bcf86cd799439011',
      products: [],
    });

    const result = await service.getMyFavorites('507f1f77bcf86cd799439011');

    expect(result.userId).toBe('507f1f77bcf86cd799439011');
    expect(result.productIds).toEqual([]);
  });

  it('agrega producto a favoritos e incrementa metricas', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    favoritesRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'fav-1' },
      userId: '507f1f77bcf86cd799439011',
      products: [],
    });
    productsRepository.findById
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860ea',
        name: 'Producto demo',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
      })
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860ea',
        name: 'Producto demo',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
      });
    favoritesRepository.addProductAndReturn.mockResolvedValue({
      added: true,
      updated: {
        id: 'fav-1',
        userId: '507f1f77bcf86cd799439011',
        products: ['507f191e810c19729de860ea'],
      },
    });

    const result = await service.addProduct('507f1f77bcf86cd799439011', {
      productId: '507f191e810c19729de860ea',
    });

    expect(productsRepository.incrementFavorites).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
    );
    expect(result.productIds).toEqual(['507f191e810c19729de860ea']);
  });

  it('quita producto de favoritos y decrementa metricas', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    favoritesRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'fav-1' },
      userId: '507f1f77bcf86cd799439011',
      products: ['507f191e810c19729de860ea'],
    });
    favoritesRepository.removeProductAndReturn.mockResolvedValue({
      removed: true,
      updated: {
        id: 'fav-1',
        userId: '507f1f77bcf86cd799439011',
        products: [],
      },
    });

    const result = await service.removeProduct(
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ea',
    );

    expect(productsRepository.decrementFavorites).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
    );
    expect(result.productIds).toEqual([]);
  });

  it('rechaza agregar producto inexistente', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    favoritesRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'fav-1' },
      userId: '507f1f77bcf86cd799439011',
      products: [],
    });
    productsRepository.findById.mockResolvedValue(null);

    await expect(
      service.addProduct('507f1f77bcf86cd799439011', {
        productId: '507f191e810c19729de860ea',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza agregar producto agotado', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    favoritesRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'fav-1' },
      userId: '507f1f77bcf86cd799439011',
      products: [],
    });
    productsRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      name: 'Producto demo',
      state: ProductState.ACTIVO,
      availability: ProductAvailability.AGOTADO,
    });

    await expect(
      service.addProduct('507f1f77bcf86cd799439011', {
        productId: '507f191e810c19729de860ea',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no incrementa metricas si el producto ya estaba en favoritos', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    productsRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      name: 'Producto demo',
      state: ProductState.ACTIVO,
      availability: ProductAvailability.DISPONIBLE,
    });
    favoritesRepository.addProductAndReturn.mockResolvedValue({
      added: false,
      updated: {
        id: 'fav-1',
        userId: '507f1f77bcf86cd799439011',
        products: ['507f191e810c19729de860ea'],
      },
    });

    await service.addProduct('507f1f77bcf86cd799439011', {
      productId: '507f191e810c19729de860ea',
    });

    expect(productsRepository.incrementFavorites).not.toHaveBeenCalled();
  });

  it('no decrementa metricas si el producto no estaba en favoritos', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    favoritesRepository.removeProductAndReturn.mockResolvedValue({
      removed: false,
      updated: {
        id: 'fav-1',
        userId: '507f1f77bcf86cd799439011',
        products: [],
      },
    });

    await service.removeProduct(
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ea',
    );

    expect(productsRepository.decrementFavorites).not.toHaveBeenCalled();
  });
});
