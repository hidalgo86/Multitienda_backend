import { Injectable } from '@nestjs/common';
import { FindByIdService } from './application/find-by-id.service';
import { SoftDeleteProductService } from './application/delete.service';
import { CreateProductService } from './application/create-product.service';
import { UpdateProductService } from './application/update-product.service';
import { CreateProductModel } from './models/createProduct.model';
import { UpdateProductModel } from './models/updateProduct.model';
import { FindProductsService } from './application/find-products.service';
import { ProductState } from './schemas/products.schema';
import { ProductsQueryModel } from './models/productsQuery.model';

@Injectable()
export class ProductsFacade {
  constructor(
    private readonly createProductService: CreateProductService,
    private readonly findByIdService: FindByIdService,
    private readonly findProductsService: FindProductsService,
    private readonly updateProductService: UpdateProductService,
    private readonly softDeleteProductService: SoftDeleteProductService,
  ) {}

  createProduct(input: CreateProductModel) {
    return this.createProductService.execute(input);
  }

  findById(id: string, actor?: { role?: string; trackView?: boolean }) {
    return this.findByIdService.execute(id, actor);
  }

  findProducts(input: ProductsQueryModel, actor?: { role?: string }) {
    return this.findProductsService.execute(input, actor);
  }

  updateProduct(id: string, body: UpdateProductModel) {
    return this.updateProductService.execute(id, body);
  }

  deleteProduct(id: string) {
    return this.softDeleteProductService.execute(id);
  }

  restoreProduct(id: string) {
    return this.updateProductService.execute(id, {
      state: ProductState.ACTIVO,
    });
  }
}
