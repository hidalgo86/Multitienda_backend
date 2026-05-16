import { Injectable } from '@nestjs/common';
import { ProductsRepository } from '@/modules/products/products.repository';
import { ProductModel } from '../models/product.model';

/**
 * ProductStatsService
 *
 * Servicio para gestionar las estadísticas de productos
 * - Incrementar contadores (views, favorites, cartAdds, purchases, searches)
 * - Obtener productos por diferentes métricas (trending, bestsellers, etc.)
 *
 * ⚠️ IMPORTANTE:
 * Todos los incrementos usan operador $inc de MongoDB para evitar race conditions
 * Nunca hacer: stats.views++; await save()
 * Siempre: updateOne({ $inc: { 'stats.views': 1 } })
 */
@Injectable()
export class ProductStatsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  /**
   * Registra una visita al detalle del producto
   * Se ejecuta automáticamente cuando el cliente accede a GET /products/:id
   */
  async trackProductView(productId: string): Promise<void> {
    await this.productsRepository.incrementViews(productId);
  }

  /**
   * Registra que el producto fue agregado a favoritos
   * Se ejecuta desde el módulo de favoritos
   */
  async trackFavorite(productId: string): Promise<void> {
    await this.productsRepository.incrementFavorites(productId);
  }

  /**
   * Registra que el producto fue agregado al carrito
   * Se ejecuta desde el módulo de carrito
   */
  async trackCartAdd(productId: string): Promise<void> {
    await this.productsRepository.incrementCartAdds(productId);
  }

  /**
   * Registra una compra
   * Se ejecuta desde el módulo de órdenes después de completar el pago
   * @param productId ID del producto
   * @param quantity Cantidad de unidades vendidas
   */
  async trackPurchase(productId: string, quantity: number): Promise<void> {
    await this.productsRepository.incrementPurchases(productId, quantity);
  }

  /**
   * Registra que el producto apareció en resultados de búsqueda
   * Se ejecuta después de una búsqueda exitosa
   */
  async trackSearch(productId: string): Promise<void> {
    await this.productsRepository.incrementSearches(productId);
  }

  /**
   * Obtiene los productos más vistos (trending view)
   * Útil para sección "Productos populares"
   */
  async getTrendingByViews(limit: number = 10): Promise<ProductModel[]> {
    return this.productsRepository.getMostViewed(limit);
  }

  /**
   * Obtiene los productos más favoritos
   * Útil para recomendaciones personalizadas
   */
  async getTrendingByFavorites(limit: number = 10): Promise<ProductModel[]> {
    return this.productsRepository.getMostFavorited(limit);
  }

  /**
   * Obtiene los productos más vendidos (bestsellers)
   * Útil para "Top ventas" o "Lo más vendido"
   */
  async getBestsellers(limit: number = 10): Promise<ProductModel[]> {
    return this.productsRepository.getMostSold(limit);
  }

  /**
   * Obtiene productos ordenados por múltiples métricas para un score de popularidad
   * Formula: (views * 0.2) + (favorites * 0.3) + (purchases * 0.5)
   * Pondera más las compras reales
   */
  async getPopularityRanking(limit: number = 10): Promise<ProductModel[]> {
    const products = await this.productsRepository.getMostSold(limit * 2);

    // Calcular score de popularidad
    const withScore = products.map((p) => ({
      ...p,
      popularityScore:
        p.stats.views * 0.2 + p.stats.favorites * 0.3 + p.stats.purchases * 0.5,
    }));

    // Ordenar por score y retornar top N
    return withScore
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit)
      .map((productWithScore) => {
        const { popularityScore: _popularityScore, ...product } =
          productWithScore;
        void _popularityScore;
        return product;
      });
  }
}
