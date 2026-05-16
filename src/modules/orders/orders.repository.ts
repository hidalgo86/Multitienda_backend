import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/orders.schema';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async create(data: Partial<Order>) {
    return new this.orderModel(data).save();
  }

  async findByUserId(userId: string) {
    return this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findById(id: string) {
    return this.orderModel.findById(id).lean().exec();
  }

  async findByOrderNumber(orderNumber: string) {
    return this.orderModel.findOne({ orderNumber }).lean().exec();
  }

  async findWithFilters(
    query: FilterQuery<Order>,
    skip: number,
    limit: number,
  ): Promise<{ items: OrderDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.orderModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findExpiredPendingWithoutProof(cutoff: Date, limit = 100) {
    return this.orderModel
      .find({
        status: OrderStatus.PENDING,
        createdAt: { $lte: cutoff },
        paymentProofSubmittedAt: { $exists: false },
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async cancelPendingById(id: string, cancelledAt: Date) {
    return this.orderModel
      .findOneAndUpdate(
        {
          _id: id,
          status: OrderStatus.PENDING,
          paymentProofSubmittedAt: { $exists: false },
        },
        {
          status: OrderStatus.CANCELLED,
          cancelledAt,
        },
        { new: true },
      )
      .lean()
      .exec();
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .lean()
      .exec();
  }

  async updateLifecycle(
    id: string,
    data: Partial<{
      status: OrderStatus;
      paymentReference: string | null;
      paidAt: Date | null;
      cancelledAt: Date | null;
    }>,
  ) {
    return this.orderModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec();
  }

  async updatePaymentProof(
    id: string,
    data: {
      paymentReceiptNumber: string;
      paymentProofUrl: string;
      paymentProofPublicId?: string;
      paymentProofSubmittedAt: Date;
    },
  ) {
    return this.orderModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec();
  }
}
