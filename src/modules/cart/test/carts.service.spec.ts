import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import {
  ProductAvailability,
  ProductState,
} from '@/modules/products/schemas/products.schema';
import { ProductsRepository } from '@/modules/products/products.repository';
import { UsersService } from '@/modules/users/users.service';
import { CartsRepository } from '../carts.repository';
import { CartsService } from '../carts.service';

describe('CartsService', () => {
  let service: CartsService;
  let cartsRepository: {
    findByUserId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findOrCreateByUserId: jest.Mock;
    replaceItemsByUserId: jest.Mock;
  };
  let usersService: {
    getUserById: jest.Mock;
  };
  let productsRepository: {
    findById: jest.Mock;
    incrementCartAdds: jest.Mock;
  };

  beforeEach(async () => {
    cartsRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOrCreateByUserId: jest.fn(),
      replaceItemsByUserId: jest.fn(),
    };

    usersService = {
      getUserById: jest.fn(),
    };

    productsRepository = {
      findById: jest.fn(),
      incrementCartAdds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: CartsRepository,
          useValue: cartsRepository,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: ProductsRepository,
          useValue: productsRepository,
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
  });

  it('crea el carrito si no existe para el usuario autenticado', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.getCartByUserId('507f1f77bcf86cd799439011');

    expect(cartsRepository.findOrCreateByUserId).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
    expect(result.userId).toBe('507f1f77bcf86cd799439011');
    expect(result.items).toEqual([]);
  });

  it('devuelve productos del carrito aunque el producto tenga id ObjectId', async () => {
    const productId = '507f191e810c19729de860ea';
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId,
          quantity: 2,
          snapshot: {
            productName: 'Producto demo',
            unitPrice: 10,
          },
        },
      ],
    });
    productsRepository.findById.mockResolvedValue({
      id: new Types.ObjectId(productId),
      name: 'Producto demo',
      state: ProductState.ACTIVO,
      availability: ProductAvailability.DISPONIBLE,
      stock: 5,
    });

    const result = await service.getCartByUserId('507f1f77bcf86cd799439011');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].product).toMatchObject({
      name: 'Producto demo',
    });
  });

  it('rechaza cantidades mayores al stock disponible', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [],
    });
    productsRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      state: ProductState.ACTIVO,
      availability: ProductAvailability.DISPONIBLE,
      stock: 2,
    });

    await expect(
      service.addToCart('507f1f77bcf86cd799439011', {
        productId: '507f191e810c19729de860ea',
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requiere variantName cuando el producto tiene variantes', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [],
    });
    productsRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      state: ProductState.ACTIVO,
      availability: ProductAvailability.DISPONIBLE,
      variants: [{ name: 'XL', stock: 2, price: 19.99 }],
    });

    await expect(
      service.addToCart('507f1f77bcf86cd799439011', {
        productId: '507f191e810c19729de860ea',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('guarda snapshot y valida stock por variante', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    productsRepository.findById
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860ea',
        name: 'Camiseta reciclada',
        thumbnail: 'https://img.test/base.jpg',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
        variants: [
          {
            name: 'XL',
            stock: 2,
            price: 19.99,
            image: 'https://img.test/xl.jpg',
          },
        ],
      })
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860ea',
        name: 'Camiseta reciclada',
        thumbnail: 'https://img.test/base.jpg',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
        variants: [
          {
            name: 'XL',
            stock: 2,
            price: 19.99,
            image: 'https://img.test/xl.jpg',
          },
        ],
      });

    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [],
    });
    cartsRepository.replaceItemsByUserId.mockResolvedValue({
      id: 'cart-1',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
          snapshot: {
            productName: 'Camiseta reciclada',
            variantName: 'XL',
            thumbnail: 'https://img.test/xl.jpg',
            unitPrice: 19.99,
          },
        },
      ],
    });

    const result = await service.addToCart('507f1f77bcf86cd799439011', {
      productId: '507f191e810c19729de860ea',
      variantName: 'XL',
      quantity: 2,
    });

    expect(cartsRepository.replaceItemsByUserId).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
          snapshot: {
            productName: 'Camiseta reciclada',
            variantName: 'XL',
            thumbnail: 'https://img.test/xl.jpg',
            unitPrice: 19.99,
          },
        },
      ],
    );
    expect(result.items[0].snapshot.unitPrice).toBe(19.99);
    expect(result.items[0].variantName).toBe('XL');
  });

  it('elimina un item cuando la cantidad es 0', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    productsRepository.findById
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860ea',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
        stock: 5,
      })
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860eb',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
        stock: 3,
      });

    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 2,
          snapshot: {
            productName: 'Prod A',
            unitPrice: 10,
          },
        },
        {
          productId: '507f191e810c19729de860eb',
          quantity: 1,
          snapshot: {
            productName: 'Prod B',
            unitPrice: 12,
          },
        },
      ],
    });
    cartsRepository.replaceItemsByUserId.mockResolvedValue({
      id: 'cart-1',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860eb',
          quantity: 1,
          snapshot: {
            productName: 'Prod B',
            unitPrice: 12,
          },
        },
      ],
    });

    const result = await service.addToCart('507f1f77bcf86cd799439011', {
      productId: '507f191e810c19729de860ea',
      quantity: 0,
    });

    expect(cartsRepository.replaceItemsByUserId).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      [
        {
          productId: '507f191e810c19729de860eb',
          quantity: 1,
          snapshot: {
            productName: 'Prod B',
            unitPrice: 12,
          },
        },
      ],
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productId).toBe('507f191e810c19729de860eb');
  });

  it('permite eliminar un item aunque el producto ya no exista', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 1,
          snapshot: {
            productName: 'Prod A',
            unitPrice: 10,
          },
        },
      ],
    });
    cartsRepository.replaceItemsByUserId.mockResolvedValue({
      id: 'cart-1',
      userId: '507f1f77bcf86cd799439011',
      items: [],
    });

    const result = await service.addToCart('507f1f77bcf86cd799439011', {
      productId: '507f191e810c19729de860ea',
      quantity: 0,
    });

    expect(productsRepository.findById).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
  });

  it('normaliza variantName para no duplicar el mismo item por casing', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    productsRepository.findById
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860ea',
        name: 'Camiseta reciclada',
        thumbnail: 'https://img.test/base.jpg',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
        variants: [
          {
            name: 'XL',
            stock: 5,
            price: 19.99,
            image: 'https://img.test/xl.jpg',
          },
        ],
      })
      .mockResolvedValueOnce({
        id: '507f191e810c19729de860ea',
        name: 'Camiseta reciclada',
        thumbnail: 'https://img.test/base.jpg',
        state: ProductState.ACTIVO,
        availability: ProductAvailability.DISPONIBLE,
        variants: [
          {
            name: 'XL',
            stock: 5,
            price: 19.99,
            image: 'https://img.test/xl.jpg',
          },
        ],
      });
    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 1,
          snapshot: {
            productName: 'Camiseta reciclada',
            variantName: 'XL',
            thumbnail: 'https://img.test/xl.jpg',
            unitPrice: 19.99,
          },
        },
      ],
    });
    cartsRepository.replaceItemsByUserId.mockResolvedValue({
      id: 'cart-1',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 3,
          snapshot: {
            productName: 'Camiseta reciclada',
            variantName: 'XL',
            thumbnail: 'https://img.test/xl.jpg',
            unitPrice: 19.99,
          },
        },
      ],
    });

    const result = await service.addToCart('507f1f77bcf86cd799439011', {
      productId: '507f191e810c19729de860ea',
      variantName: ' xl ',
      quantity: 3,
    });

    expect(cartsRepository.replaceItemsByUserId).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 3,
          snapshot: {
            productName: 'Camiseta reciclada',
            variantName: 'XL',
            thumbnail: 'https://img.test/xl.jpg',
            unitPrice: 19.99,
          },
        },
      ],
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].variantName).toBe('XL');
  });

  it('lanza error si el producto no existe', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
    });
    cartsRepository.findOrCreateByUserId.mockResolvedValue({
      _id: { toString: () => 'cart-1' },
      userId: '507f1f77bcf86cd799439011',
      items: [],
    });
    productsRepository.findById.mockResolvedValue(null);

    await expect(
      service.addToCart('507f1f77bcf86cd799439011', {
        productId: '507f191e810c19729de860ea',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
