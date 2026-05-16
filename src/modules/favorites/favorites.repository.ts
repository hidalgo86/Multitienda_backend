import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';

@Injectable()
export class FavoritesRepository {
  constructor(
    @InjectModel(Favorite.name) private favoritesModel: Model<FavoriteDocument>,
  ) {}

  async findByUserId(userId: string): Promise<FavoriteDocument | null> {
    return this.favoritesModel.findOne({ userId }).exec();
  }

  async findOrCreateByUserId(userId: string): Promise<FavoriteDocument> {
    return this.favoritesModel
      .findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            userId,
            products: [],
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

  async addProduct(userId: string, productId: string) {
    return this.favoritesModel
      .updateOne(
        { userId },
        {
          $setOnInsert: { userId },
          $addToSet: { products: productId },
        },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  async addProductAndReturn(
    userId: string,
    productId: string,
  ): Promise<{
    updated: FavoriteDocument;
    added: boolean;
  }> {
    const result = await this.addProduct(userId, productId);
    const updated = await this.findOrCreateByUserId(userId);
    return {
      updated,
      added: result.modifiedCount > 0 || result.upsertedCount > 0,
    };
  }

  async removeProduct(userId: string, productId: string) {
    return this.favoritesModel
      .updateOne(
        { userId },
        { $pull: { products: productId } },
        {
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  async removeProductAndReturn(
    userId: string,
    productId: string,
  ): Promise<{
    updated: FavoriteDocument;
    removed: boolean;
  }> {
    const result = await this.removeProduct(userId, productId);
    const updated = await this.findOrCreateByUserId(userId);
    return {
      updated,
      removed: result.modifiedCount > 0,
    };
  }

  async replaceProductsByUserId(userId: string, productIds: string[]) {
    return this.favoritesModel
      .findOneAndUpdate(
        { userId },
        { $set: { products: productIds } },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();
  }

  async deleteByUserId(userId: string) {
    return this.favoritesModel.deleteMany({ userId }).exec();
  }
}
