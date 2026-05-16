// src/modules/products/products.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Product,
  ProductDocument,
  ProductAvailability,
  ProductState,
} from './schemas/products.schema';
import { Model, FilterQuery, PipelineStage } from 'mongoose';
import { CreateProductModel } from './models/createProduct.model';
import { ProductModel } from './models/product.model';
import {
  ProductsQueryModel,
  ProductSortBy,
} from './models/productsQuery.model';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findWithFiltersQueryModel(queryModel: ProductsQueryModel): Promise<{
    items: ProductModel[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { filters, pagination } = queryModel;
    const query: FilterQuery<Product> = {};

    // --- FILTROS ---
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.genre) query.genre = filters.genre;
    if (filters.state !== undefined) {
      query.state = filters.state;
    } else if (!filters.includeDeleted) {
      query.state = { $ne: ProductState.ELIMINADO };
    }
    if (filters.availability !== undefined)
      query.availability = filters.availability;

    const hasVariantNamesFilter =
      Array.isArray(filters.variantNames) && filters.variantNames.length > 0;
    const hasPriceFilter =
      filters.minPrice !== undefined || filters.maxPrice !== undefined;

    if (hasVariantNamesFilter || hasPriceFilter) {
      const priceCond: { $gte?: number; $lte?: number } = {};
      if (filters.minPrice !== undefined) priceCond.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceCond.$lte = filters.maxPrice;

      // Si se filtra por nombre de variante, el filtro aplica sobre variants.
      if (hasVariantNamesFilter) {
        const variantCond: {
          name: {
            $in: NonNullable<ProductsQueryModel['filters']['variantNames']>;
          };
          price?: { $gte?: number; $lte?: number };
        } = {
          name: { $in: filters.variantNames as string[] },
        };

        if (hasPriceFilter) {
          variantCond.price = priceCond;
        }

        query.variants = { $elemMatch: variantCond };
      } else if (hasPriceFilter) {
        // Sin filtro por variante: incluir productos simples y con variantes.
        (
          query as FilterQuery<Product> & {
            $or?: Array<Record<string, unknown>>;
          }
        ).$or = [
          { price: priceCond },
          { variants: { $elemMatch: { price: priceCond } } },
        ];
      }
    }

    // --- PAGINACION ---
    const limit = pagination?.limit ?? 20;
    const requestedPage = Math.max(pagination?.page ?? 1, 1);
    const requestedSkip = (requestedPage - 1) * limit;

    const sortBy = pagination?.sortBy ?? ProductSortBy.NEWEST;
    const isPriceSort =
      sortBy === ProductSortBy.PRICE_ASC || sortBy === ProductSortBy.PRICE_DESC;

    if (isPriceSort) {
      const priceOrder = sortBy === ProductSortBy.PRICE_ASC ? 1 : -1;

      const buildPriceSortPipeline = (skip: number): PipelineStage[] => [
        { $match: query as Record<string, unknown> },
        {
          $addFields: {
            // Precio efectivo para ordenar:
            // - price global en productos simples
            // - mínimo variants.price en productos con variantes
            sortPrice: { $ifNull: ['$price', { $min: '$variants.price' }] },
          },
        },
        { $sort: { sortPrice: priceOrder, createdAt: -1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { sortPrice: 0 } },
      ];

      const [total, initialItems] = await Promise.all([
        this.productModel.countDocuments(query).exec(),
        this.productModel
          .aggregate(buildPriceSortPipeline(requestedSkip))
          .exec(),
      ]);
      let items = initialItems;

      const totalPages = Math.max(Math.ceil(total / limit), 1);
      let page = requestedPage;

      if (page > totalPages) {
        page = totalPages;
        const skip = (page - 1) * limit;
        items = await this.productModel
          .aggregate(buildPriceSortPipeline(skip))
          .exec();
      }

      return {
        items: items.map((item) => this.normalizeRawItem(item)),
        total,
        page,
        totalPages,
      };
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sortBy) {
      case ProductSortBy.OLDEST:
        sort = { createdAt: 1, _id: 1 };
        break;
      case ProductSortBy.NAME_ASC:
        sort = { name: 1, _id: 1 };
        break;
      case ProductSortBy.NAME_DESC:
        sort = { name: -1, _id: 1 };
        break;
      case ProductSortBy.MOST_VIEWED:
        sort = { 'stats.views': -1, createdAt: -1, _id: 1 };
        break;
      case ProductSortBy.MOST_FAVORITED:
        sort = { 'stats.favorites': -1, createdAt: -1, _id: 1 };
        break;
      case ProductSortBy.MOST_CART_ADDED:
        sort = { 'stats.cartAdds': -1, createdAt: -1, _id: 1 };
        break;
      case ProductSortBy.MOST_PURCHASED:
        sort = { 'stats.purchases': -1, createdAt: -1, _id: 1 };
        break;
      case ProductSortBy.MOST_SEARCHED:
        sort = { 'stats.searches': -1, createdAt: -1, _id: 1 };
        break;
      case ProductSortBy.NEWEST:
      default:
        sort = { createdAt: -1 };
    }

    const [total, initialItems] = await Promise.all([
      this.productModel.countDocuments(query).exec(),
      this.productModel
        .find(query)
        .sort(sort)
        .skip(requestedSkip)
        .limit(limit)
        .exec(),
    ]);
    let items = initialItems;

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    let page = requestedPage;

    if (page > totalPages) {
      page = totalPages;
      const skip = (page - 1) * limit;
      items = await this.productModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec();
    }

    return {
      items: items.map((item) => this.normalizeRawItem(item.toObject())),
      total,
      page,
      totalPages,
    };
  }

  private normalizeRawItem(raw: unknown): ProductModel {
    const item = raw as Record<string, unknown>;
    if (item.id === undefined && item._id !== undefined) {
      item.id = item._id;
    }
    delete item._id;
    delete item.__v;
    return item as unknown as ProductModel;
  }

  async create(data: CreateProductModel): Promise<ProductModel> {
    const product = (await new this.productModel(data).save()).toObject();
    return this.normalizeRawItem(product);
  }

  async findById(id: string): Promise<ProductModel | null> {
    const product = (await this.productModel.findById(id).exec())?.toObject();
    if (!product) return null;
    return this.normalizeRawItem(product);
  }

  async update(
    id: string,
    data: Partial<ProductModel>,
  ): Promise<ProductModel | null> {
    const document = await this.productModel.findById(id).exec();
    if (!document) {
      return null;
    }

    Object.assign(document, data);
    const saved = (await document.save()).toObject();
    return this.normalizeRawItem(saved);
  }

  async delete(id: string): Promise<ProductModel | null> {
    const document = await this.productModel.findById(id).exec();
    if (!document) {
      return null;
    }

    document.state = ProductState.ELIMINADO;
    const saved = (await document.save()).toObject();
    return this.normalizeRawItem(saved);
  }

  async skuExists(sku: string): Promise<boolean> {
    const count = await this.productModel.countDocuments({ sku }).exec();
    return count > 0;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.productModel.countDocuments({ slug }).exec();
    return count > 0;
  }

  async incrementViews(productId: string): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId }, { $inc: { 'stats.views': 1 } })
      .exec();
  }

  async incrementFavorites(productId: string): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId }, { $inc: { 'stats.favorites': 1 } })
      .exec();
  }

  async decrementFavorites(
    productId: string,
    amount: number = 1,
  ): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId }, [
        {
          $set: {
            'stats.favorites': {
              $max: [{ $subtract: ['$stats.favorites', amount] }, 0],
            },
          },
        },
      ])
      .exec();
  }

  async incrementCartAdds(productId: string): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId }, { $inc: { 'stats.cartAdds': 1 } })
      .exec();
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    return this.productModel.countDocuments({ categoryId }).exec();
  }

  async incrementPurchases(productId: string, quantity: number): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId }, { $inc: { 'stats.purchases': quantity } })
      .exec();
  }

  async decrementPurchases(productId: string, quantity: number): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId }, { $inc: { 'stats.purchases': -quantity } })
      .exec();
  }

  async incrementSearches(productId: string): Promise<void> {
    await this.productModel
      .updateOne({ _id: productId }, { $inc: { 'stats.searches': 1 } })
      .exec();
  }

  async getMostViewed(limit: number = 10): Promise<ProductModel[]> {
    const products = await this.productModel
      .find()
      .sort({ 'stats.views': -1 })
      .limit(limit)
      .exec();
    return products.map((p) => this.normalizeRawItem(p.toObject()));
  }

  async getMostFavorited(limit: number = 10): Promise<ProductModel[]> {
    const products = await this.productModel
      .find()
      .sort({ 'stats.favorites': -1 })
      .limit(limit)
      .exec();
    return products.map((p) => this.normalizeRawItem(p.toObject()));
  }

  async getMostSold(limit: number = 10): Promise<ProductModel[]> {
    const products = await this.productModel
      .find()
      .sort({ 'stats.purchases': -1 })
      .limit(limit)
      .exec();
    return products.map((p) => this.normalizeRawItem(p.toObject()));
  }

  async reserveStock(
    productId: string,
    quantity: number,
    variantName?: string,
  ): Promise<boolean> {
    const query = variantName
      ? {
          _id: productId,
          variants: {
            $elemMatch: { name: variantName, stock: { $gte: quantity } },
          },
        }
      : {
          _id: productId,
          stock: { $gte: quantity },
        };

    const update = variantName
      ? {
          $inc: {
            'variants.$.stock': -quantity,
          },
        }
      : {
          $inc: {
            stock: -quantity,
          },
        };

    const result = await this.productModel.updateOne(query, update).exec();
    if (result.modifiedCount > 0) {
      await this.syncAvailability(productId);
      return true;
    }

    return false;
  }

  async restoreStock(
    productId: string,
    quantity: number,
    variantName?: string,
  ): Promise<void> {
    const query = variantName
      ? { _id: productId, 'variants.name': variantName }
      : { _id: productId };

    const update = variantName
      ? {
          $inc: {
            'variants.$.stock': quantity,
          },
        }
      : {
          $inc: {
            stock: quantity,
          },
        };

    await this.productModel.updateOne(query, update).exec();
    await this.syncAvailability(productId);
  }

  private async syncAvailability(productId: string): Promise<void> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      return;
    }

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      product.availability = product.variants.some(
        (variant) => variant.stock > 0,
      )
        ? ProductAvailability.DISPONIBLE
        : ProductAvailability.AGOTADO;
    } else if (product.stock !== undefined) {
      product.availability =
        product.stock > 0
          ? ProductAvailability.DISPONIBLE
          : ProductAvailability.AGOTADO;
    }

    await product.save();
  }
}
