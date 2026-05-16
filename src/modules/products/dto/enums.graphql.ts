import { registerEnumType } from '@nestjs/graphql';
import {
  ProductState,
  ProductAvailability,
  Genre,
} from '../schemas/products.schema';
import { ProductSortBy } from '../models/productsQuery.model';

registerEnumType(Genre, { name: 'Genre' });
registerEnumType(ProductState, { name: 'ProductState' });
registerEnumType(ProductAvailability, { name: 'ProductAvailability' });
registerEnumType(ProductSortBy, { name: 'ProductSortBy' });
