import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from '@/modules/cart/carts.service';
import { ProductsRepository } from '@/modules/products/products.repository';
import {
  ProductAvailability,
  ProductState,
} from '@/modules/products/schemas/products.schema';
import { UsersService } from '@/modules/users/users.service';
import { OrdersRepository } from '../orders.repository';
import { OrdersService } from '../orders.service';
import { OrderStatus, PaymentMethod } from '../schemas/orders.schema';
import {
  CheckoutPaymentMethod,
  DeliveryMethod,
} from '../dto/inputs/checkout.input';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: {
    create: jest.Mock;
    findByUserId: jest.Mock;
    findById: jest.Mock;
    findByOrderNumber: jest.Mock;
    findExpiredPendingWithoutProof: jest.Mock;
    cancelPendingById: jest.Mock;
    updateStatus: jest.Mock;
    updateLifecycle: jest.Mock;
    updatePaymentProof: jest.Mock;
  };
  let cartsService: { getCartByUserId: jest.Mock; clearCart: jest.Mock };
  let productsRepository: {
    findById: jest.Mock;
    reserveStock: jest.Mock;
    restoreStock: jest.Mock;
    incrementPurchases: jest.Mock;
    decrementPurchases: jest.Mock;
  };
  let usersService: { getUserById: jest.Mock };

  beforeEach(async () => {
    ordersRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByOrderNumber: jest.fn(),
      findExpiredPendingWithoutProof: jest.fn(),
      cancelPendingById: jest.fn(),
      updateStatus: jest.fn(),
      updateLifecycle: jest.fn(),
      updatePaymentProof: jest.fn(),
    };
    cartsService = { getCartByUserId: jest.fn(), clearCart: jest.fn() };
    productsRepository = {
      findById: jest.fn(),
      reserveStock: jest.fn(),
      restoreStock: jest.fn(),
      incrementPurchases: jest.fn(),
      decrementPurchases: jest.fn(),
    };
    usersService = { getUserById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: OrdersRepository, useValue: ordersRepository },
        { provide: CartsService, useValue: cartsService },
        { provide: ProductsRepository, useValue: productsRepository },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('crea una orden desde el carrito y limpia el carrito', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
      name: 'Carlos Demo',
      address: 'Calle 123, Madrid',
      phone: '+34123456789',
      isEmailVerified: true,
    });
    cartsService.getCartByUserId.mockResolvedValue({
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 2,
        },
      ],
    });
    productsRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      name: 'Botella reciclada',
      thumbnail: 'https://img.test/botella.jpg',
      stock: 5,
      price: 14.5,
      state: ProductState.ACTIVO,
      availability: ProductAvailability.DISPONIBLE,
    });
    productsRepository.reserveStock.mockResolvedValue(true);
    ordersRepository.findByOrderNumber.mockResolvedValue(null);
    ordersRepository.create.mockResolvedValue({
      toObject: () => ({
        id: 'order-1',
        orderNumber: 'PED-20260421-ABC123',
        userId: '507f1f77bcf86cd799439011',
        items: [
          {
            productId: '507f191e810c19729de860ea',
            quantity: 2,
            productName: 'Botella reciclada',
            thumbnail: 'https://img.test/botella.jpg',
            unitPrice: 14.5,
            lineTotal: 29,
          },
        ],
        totalAmount: 29,
        shippingAddress: {
          address: 'Retiro en tienda',
          name: undefined,
          phone: undefined,
        },
        status: 'pending',
        paymentMethod: PaymentMethod.MANUAL,
        paymentReference: 'bank_transfer',
        paidAt: null,
        cancelledAt: null,
      }),
    });

    const result = await service.checkout('507f1f77bcf86cd799439011');

    expect(ordersRepository.create).toHaveBeenCalled();
    expect(productsRepository.reserveStock).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
      2,
      undefined,
    );
    expect(cartsService.clearCart).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
    expect(ordersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: expect.stringMatching(/^PED-\d{8}-[0-9A-F]{6}$/),
        shippingAddress: {
          address: 'Retiro en tienda',
          name: undefined,
          phone: undefined,
        },
        paymentReference: 'bank_transfer',
      }),
    );
    expect(result.totalAmount).toBe(29);
    expect(result.orderNumber).toBe('PED-20260421-ABC123');
    expect(result.shippingAddress.address).toBe('Retiro en tienda');
    expect(result.shippingAddress.name).toBeUndefined();
    expect(result.shippingAddress.phone).toBeUndefined();
    expect(result.status).toBe('pending');
    expect(result.paymentMethod).toBe(PaymentMethod.MANUAL);
    expect(productsRepository.incrementPurchases).not.toHaveBeenCalled();
  });

  it('rechaza checkout con carrito vacio', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      address: 'Calle 123, Madrid',
    });
    cartsService.getCartByUserId.mockResolvedValue({
      userId: '507f1f77bcf86cd799439011',
      items: [],
    });

    await expect(
      service.checkout('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crea checkout para retiro aunque el usuario no tiene direccion', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
      address: null,
      isEmailVerified: true,
    });
    cartsService.getCartByUserId.mockResolvedValue({
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 1,
        },
      ],
    });
    productsRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      name: 'Botella reciclada',
      stock: 5,
      price: 14.5,
      state: ProductState.ACTIVO,
      availability: ProductAvailability.DISPONIBLE,
    });
    productsRepository.reserveStock.mockResolvedValue(true);
    ordersRepository.findByOrderNumber.mockResolvedValue(null);
    ordersRepository.create.mockResolvedValue({
      toObject: () => ({
        id: 'order-1',
        orderNumber: 'PED-20260421-ABC123',
        userId: '507f1f77bcf86cd799439011',
        items: [],
        totalAmount: 14.5,
        shippingAddress: {
          address: 'Retiro en tienda',
        },
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.MANUAL,
        paymentReference: 'bank_transfer',
      }),
    });

    const result = await service.checkout('507f1f77bcf86cd799439011');

    expect(ordersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        shippingAddress: {
          address: 'Retiro en tienda',
          name: undefined,
          phone: undefined,
        },
        paymentReference: 'bank_transfer',
      }),
    );
    expect(result.shippingAddress.address).toBe('Retiro en tienda');
  });

  it('guarda referencia de pago en efectivo al retirar', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
      isEmailVerified: true,
    });
    cartsService.getCartByUserId.mockResolvedValue({
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 1,
        },
      ],
    });
    productsRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      name: 'Botella reciclada',
      stock: 5,
      price: 14.5,
      state: ProductState.ACTIVO,
      availability: ProductAvailability.DISPONIBLE,
    });
    productsRepository.reserveStock.mockResolvedValue(true);
    ordersRepository.findByOrderNumber.mockResolvedValue(null);
    ordersRepository.create.mockResolvedValue({
      toObject: () => ({
        id: 'order-1',
        orderNumber: 'PED-20260421-ABC123',
        userId: '507f1f77bcf86cd799439011',
        items: [],
        totalAmount: 14.5,
        shippingAddress: {
          address: 'Retiro en tienda',
        },
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.MANUAL,
        paymentReference: 'cash_on_pickup',
      }),
    });

    await service.checkout('507f1f77bcf86cd799439011', {
      paymentMethod: CheckoutPaymentMethod.CASH,
    });

    expect(ordersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: PaymentMethod.MANUAL,
        paymentReference: 'cash_on_pickup',
      }),
    );
  });

  it('rechaza checkout si el correo no esta verificado', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
      isEmailVerified: false,
    });
    cartsService.getCartByUserId.mockResolvedValue({
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 1,
        },
      ],
    });

    await expect(
      service.checkout('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ordersRepository.create).not.toHaveBeenCalled();
  });

  it('rechaza envio a domicilio si faltan datos de envio', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
      name: 'Carlos Demo',
      phone: '',
      address: '',
      isEmailVerified: true,
    });
    cartsService.getCartByUserId.mockResolvedValue({
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 1,
        },
      ],
    });

    await expect(
      service.checkout('507f1f77bcf86cd799439011', {
        deliveryMethod: DeliveryMethod.DELIVERY,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ordersRepository.create).not.toHaveBeenCalled();
  });

  it('rechaza que el usuario marque una orden como pagada', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    ordersRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Calle 123, Madrid',
        name: 'Carlos Demo',
        phone: '+34123456789',
      },
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: null,
      paidAt: null,
      cancelledAt: null,
    });
    await expect(
      service.payOrder('507f1f77bcf86cd799439011', '507f191e810c19729de860ec'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(ordersRepository.updateLifecycle).not.toHaveBeenCalled();
    expect(productsRepository.incrementPurchases).not.toHaveBeenCalled();
  });

  it('guarda comprobante de pago en una orden pendiente', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    ordersRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [],
      totalAmount: 29,
      shippingAddress: {
        address: 'Retiro en tienda',
      },
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.MANUAL,
    });
    ordersRepository.updatePaymentProof.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [],
      totalAmount: 29,
      shippingAddress: {
        address: 'Retiro en tienda',
      },
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReceiptNumber: 'OP-123',
      paymentProofUrl: 'https://res.cloudinary.com/demo/image/upload/proof.jpg',
      paymentProofPublicId: 'payment-proofs/proof',
      paymentProofSubmittedAt: new Date('2026-04-21T12:00:00.000Z'),
    });

    const result = await service.submitPaymentProof(
      '507f1f77bcf86cd799439011',
      {
        orderId: '507f191e810c19729de860ec',
        paymentReceiptNumber: 'OP-123',
        paymentProofUrl:
          'https://res.cloudinary.com/demo/image/upload/proof.jpg',
        paymentProofPublicId: 'payment-proofs/proof',
      },
    );

    expect(ordersRepository.updatePaymentProof).toHaveBeenCalledWith(
      '507f191e810c19729de860ec',
      expect.objectContaining({
        paymentReceiptNumber: 'OP-123',
        paymentProofUrl:
          'https://res.cloudinary.com/demo/image/upload/proof.jpg',
        paymentProofPublicId: 'payment-proofs/proof',
      }),
    );
    expect(result.paymentReceiptNumber).toBe('OP-123');
    expect(result.paymentProofUrl).toBe(
      'https://res.cloudinary.com/demo/image/upload/proof.jpg',
    );
  });

  it('permite al admin marcar pagada una orden pendiente sin comprobante', async () => {
    ordersRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Retiro en tienda',
      },
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.MANUAL,
    });
    ordersRepository.updateLifecycle.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Retiro en tienda',
      },
      status: OrderStatus.PAID,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: 'pay_test_123',
      paidAt: new Date('2026-04-21T12:00:00.000Z'),
      cancelledAt: null,
    });

    const result = await service.adminPayOrder('507f191e810c19729de860ec');

    expect(ordersRepository.updateLifecycle).toHaveBeenCalledWith(
      '507f191e810c19729de860ec',
      expect.objectContaining({
        status: OrderStatus.PAID,
        paidAt: expect.any(Date),
        cancelledAt: null,
      }),
    );
    expect(productsRepository.incrementPurchases).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
      2,
    );
    expect(result.status).toBe(OrderStatus.PAID);
  });

  it('permite al admin revertir una orden pagada a pendiente', async () => {
    ordersRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Retiro en tienda',
      },
      status: OrderStatus.PAID,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: 'pay_test_123',
      paidAt: new Date('2026-04-21T12:00:00.000Z'),
      cancelledAt: null,
    });
    ordersRepository.updateLifecycle.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Retiro en tienda',
      },
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: null,
      paidAt: null,
      cancelledAt: null,
    });

    const result = await service.adminUnpayOrder('507f191e810c19729de860ec');

    expect(ordersRepository.updateLifecycle).toHaveBeenCalledWith(
      '507f191e810c19729de860ec',
      expect.objectContaining({
        status: OrderStatus.PENDING,
        paymentReference: null,
        paidAt: null,
      }),
    );
    expect(productsRepository.decrementPurchases).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
      2,
    );
    expect(productsRepository.restoreStock).not.toHaveBeenCalled();
    expect(result.status).toBe(OrderStatus.PENDING);
  });

  it('cancela una orden pagada y repone stock', async () => {
    usersService.getUserById.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      username: 'demo',
    });
    ordersRepository.findById.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Calle 123, Madrid',
        name: 'Carlos Demo',
        phone: '+34123456789',
      },
      status: OrderStatus.PAID,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: 'pay_test_123',
      paidAt: new Date('2026-04-21T12:00:00.000Z'),
      cancelledAt: null,
    });
    ordersRepository.updateLifecycle.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Calle 123, Madrid',
        name: 'Carlos Demo',
        phone: '+34123456789',
      },
      status: OrderStatus.CANCELLED,
      paymentMethod: PaymentMethod.MANUAL,
      paymentReference: 'pay_test_123',
      paidAt: new Date('2026-04-21T12:00:00.000Z'),
      cancelledAt: new Date('2026-04-21T12:30:00.000Z'),
    });

    const result = await service.cancelOrder(
      '507f1f77bcf86cd799439011',
      '507f191e810c19729de860ec',
    );

    expect(productsRepository.restoreStock).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
      2,
      'XL',
    );
    expect(productsRepository.decrementPurchases).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
      2,
    );
    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(result.cancelledAt).toBeDefined();
  });

  it('cancela automaticamente ordenes pendientes vencidas y libera stock', async () => {
    const now = new Date('2026-04-23T12:00:00.000Z');
    ordersRepository.findExpiredPendingWithoutProof.mockResolvedValue([
      {
        _id: { toString: () => '507f191e810c19729de860ec' },
        userId: '507f1f77bcf86cd799439011',
        items: [
          {
            productId: '507f191e810c19729de860ea',
            variantName: 'XL',
            quantity: 2,
          },
        ],
        totalAmount: 29,
        shippingAddress: {
          address: 'Retiro en tienda',
        },
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.MANUAL,
        createdAt: new Date('2026-04-21T11:00:00.000Z'),
      },
    ]);
    ordersRepository.cancelPendingById.mockResolvedValue({
      id: '507f191e810c19729de860ec',
      userId: '507f1f77bcf86cd799439011',
      items: [
        {
          productId: '507f191e810c19729de860ea',
          variantName: 'XL',
          quantity: 2,
        },
      ],
      totalAmount: 29,
      shippingAddress: {
        address: 'Retiro en tienda',
      },
      status: OrderStatus.CANCELLED,
      paymentMethod: PaymentMethod.MANUAL,
      cancelledAt: now,
    });

    const result = await service.cancelExpiredPendingOrders(now);

    expect(ordersRepository.findExpiredPendingWithoutProof).toHaveBeenCalledWith(
      new Date('2026-04-21T12:00:00.000Z'),
    );
    expect(ordersRepository.cancelPendingById).toHaveBeenCalledWith(
      '507f191e810c19729de860ec',
      now,
    );
    expect(productsRepository.restoreStock).toHaveBeenCalledWith(
      '507f191e810c19729de860ea',
      2,
      'XL',
    );
    expect(result).toBe(1);
  });
});
