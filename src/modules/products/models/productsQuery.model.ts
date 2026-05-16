// src/modules/products/models/productsQuery.model.ts
import {
  ProductState,
  ProductAvailability,
  Genre,
} from '../schemas/products.schema';

export enum ProductSortBy {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  NAME_ASC = 'NAME_ASC',
  NAME_DESC = 'NAME_DESC',
  MOST_VIEWED = 'MOST_VIEWED',
  MOST_FAVORITED = 'MOST_FAVORITED',
  MOST_CART_ADDED = 'MOST_CART_ADDED',
  MOST_PURCHASED = 'MOST_PURCHASED',
  MOST_SEARCHED = 'MOST_SEARCHED',
}

export class ProductFiltersModel {
  name?: string;
  categoryId?: string;
  genre?: Genre;
  variantNames?: string[];
  minPrice?: number;
  maxPrice?: number;
  state?: ProductState;
  availability?: ProductAvailability;
  includeDeleted?: boolean;
}

export class PaginationModel {
  page!: number;
  limit!: number;
  sortBy?: ProductSortBy;
}

export class ProductsQueryModel {
  filters!: ProductFiltersModel;
  pagination!: PaginationModel;

  constructor(input?: Partial<ProductsQueryModel>) {
    this.filters = input?.filters ?? {};
    this.pagination = input?.pagination ?? { page: 1, limit: 20 };
  }
}
