import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/carts.schema';
import { Model } from 'mongoose';

@Injectable()
export class CartsRepository {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  // Create a new cart
  async create(data: Partial<Cart>) {
    return new this.cartModel(data).save();
  }

  // Find a cart by userId
  async findByUserId(userId: string) {
    return this.cartModel.findOne({ userId }).exec();
  }

  async findOrCreateByUserId(userId: string) {
    return this.cartModel
      .findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            items: [],
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  // Update a cart
  async update(id: string, data: Partial<Cart>) {
    const updated = await this.cartModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec();
    if (!updated) return null;
    return {
      ...updated,
      id: updated._id?.toString?.() ?? updated._id,
    };
  }

  async replaceItemsByUserId(
    userId: string,
    items: Cart['items'],
  ): Promise<
    | (Cart & {
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
      })
    | null
  > {
    const updated = await this.cartModel
      .findOneAndUpdate(
        { userId },
        { $set: { items } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    if (!updated) return null;

    return {
      ...updated,
      id: updated._id?.toString?.() ?? updated._id,
    };
  }

  // Delete a cart
  async delete(id: string) {
    return this.cartModel.findByIdAndDelete(id).lean().exec();
  }

  async deleteByUserId(userId: string) {
    return this.cartModel.deleteMany({ userId }).exec();
  }
}
