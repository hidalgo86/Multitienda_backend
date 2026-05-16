// src/modules/products/schemas/products.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

// Estado del producto (activo o eliminado)
export enum ProductState {
  ACTIVO = 'activo',
  ELIMINADO = 'eliminado',
}

// Disponibilidad del producto (disponible o agotado)
export enum ProductAvailability {
  DISPONIBLE = 'disponible',
  AGOTADO = 'agotado',
}

// Género del producto cuando aplique al rubro
export enum Genre {
  NINA = 'niña',
  NINO = 'niño',
  UNISEX = 'unisex',
}

// Subdocumento para variantes genéricas
@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  stock!: number;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop()
  image?: string;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

// Subdocumento para imágenes
@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  publicId!: string;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

// Subdocumento para estadísticas del producto
/**
 * ProductStats: Métricas de engagement y ventas del producto
 * Se usa para Analytics, Recomendaciones y Ranking de productos
 *
 * - views: Visitas al detalle del producto
 * - favorites: Veces que fue agregado a favoritos
 * - cartAdds: Veces que fue agregado al carrito
 * - purchases: Cantidad total vendida
 * - searches: Veces que apareció en resultados de búsqueda
 *
 * ⚠️ Importante: Usar operador $inc de MongoDB para evitar race conditions
 * Nunca hacer: stats.views++; await save()
 * Siempre hacer: updateOne({ $inc: { 'stats.views': 1 } })
 */
@Schema({ _id: false })
export class ProductStats {
  @Prop({ type: Number, default: 0, min: 0 })
  views!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  favorites!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  cartAdds!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  purchases!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  searches!: number;
}

export const ProductStatsSchema = SchemaFactory.createForClass(ProductStats);

// Esquema principal del producto
@Schema({ timestamps: true })
export class Product {
  /**
   * SKU (Stock Keeping Unit) - Código único del producto
   * ⚠️ INMUTABLE: Se genera al crear y NUNCA se puede cambiar
   * Formato: CAT-XXXXXX (ejemplo: PRF-8F3K2A)
   *
   * Único a nivel mundial en la base de datos.
   * Garantizado por índice único y validación de aplicación.
   *
   * Uso: Clientes lo usan para reclamos/reportes
   * Búsqueda: Indexado para búsquedas instantáneas
   */
  @Prop({ required: true })
  sku!: string;

  @Prop({ required: true })
  slug!: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop()
  brand?: string;

  @Prop()
  thumbnail?: string;

  // Galería de imágenes
  @Prop({ type: [ProductImageSchema], default: [] })
  images?: ProductImage[];

  @Prop({ enum: ProductState, default: ProductState.ACTIVO })
  state!: ProductState;

  @Prop({ enum: ProductAvailability, default: ProductAvailability.DISPONIBLE })
  availability!: ProductAvailability;

  // Opcional: útil para rubros donde aplique clasificación por género
  @Prop({ enum: Genre })
  genre?: Genre;

  @Prop({ type: [ProductVariantSchema], default: undefined })
  variants?: ProductVariant[];

  // Solo para producto simple sin variantes
  @Prop({ type: Number, min: 0 })
  stock?: number;

  @Prop({ type: Number, min: 0 })
  price?: number;

  /**
   * Estadísticas del producto para analytics y recomendaciones
   * - views: visitas al detalle
   * - favorites: agregados a favoritos
   * - cartAdds: agregados al carrito
   * - purchases: cantidad vendida
   * - searches: apariciones en búsquedas
   */
  @Prop({ type: ProductStatsSchema, default: () => ({}) })
  stats!: ProductStats;
}
export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);

// Limpiar documento automáticamente:
// - Eliminar variants vacías
// - Limpiar stock/price si hay variantes
ProductSchema.pre('validate', function (next) {
  const doc = this as ProductDocument;

  // Si variants es un array vacío, eliminarlo
  if (doc.variants?.length === 0) {
    doc.variants = undefined;
  }

  // Si existe variants, no usar stock ni price globales
  if (doc.variants?.length) {
    doc.stock = undefined;
    doc.price = undefined;
  }

  // Asegura consistencia: debe existir precio global o variantes
  if (!doc.variants?.length && doc.price === undefined) {
    return next(new Error('Product must have price or variants'));
  }

  next();
});

// Calcular availability automáticamente basado en stock
// Para variants: si alguna tiene stock > 0, está disponible
// Para simple: si stock > 0, está disponible
ProductSchema.pre('save', function (next) {
  const doc = this as ProductDocument;

  if (doc.variants?.some((v) => v.stock < 0)) {
    return next(new Error('Variant stock cannot be negative'));
  }

  if (doc.variants?.length) {
    // Producto con variantes: disponible si al menos una variante tiene stock
    const hasStock = doc.variants.some((v) => v.stock > 0);
    doc.availability = hasStock
      ? ProductAvailability.DISPONIBLE
      : ProductAvailability.AGOTADO;
  } else if (doc.stock !== undefined) {
    // Producto simple: disponible si stock > 0
    doc.availability =
      doc.stock > 0
        ? ProductAvailability.DISPONIBLE
        : ProductAvailability.AGOTADO;
  }

  next();
});

// Transform básico: exponer id y ocultar metadata interna
ProductSchema.set('toObject', {
  virtuals: false,
  transform: (_: unknown, ret: Record<string, unknown>) => {
    (ret as { id?: unknown }).id = ret._id;
    delete (ret as { _id?: unknown })._id;
    delete (ret as { __v?: unknown }).__v;
    return ret;
  },
});

ProductSchema.set('toJSON', {
  virtuals: false,
  transform: (_: unknown, ret: Record<string, unknown>) => {
    (ret as { id?: unknown }).id = ret._id;
    delete (ret as { _id?: unknown })._id;
    delete (ret as { __v?: unknown }).__v;
    return ret;
  },
});

// Índice único compuesto para SKU (máxima seguridad multi-servidor)
ProductSchema.index({ sku: 1 }, { unique: true });

// Índice único para slug amigable de URL
ProductSchema.index({ slug: 1 }, { unique: true });

// Índice de texto para búsquedas por nombre y descripción
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ name: 1 });

// Índices para filtros frecuentes
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ availability: 1 });
ProductSchema.index({ state: 1 });
ProductSchema.index({ genre: 1 });

// Índices para filtrar y ordenar por precio
ProductSchema.index({ price: 1 });
ProductSchema.index({ 'variants.price': 1 });

// Índice para filtrar por nombre de variante (talla, color, volumen, etc.)
ProductSchema.index({ 'variants.name': 1 });

// Índices para popularidad/ranking
ProductSchema.index({ 'stats.purchases': -1 });
ProductSchema.index({ 'stats.views': -1 });

// Índice para ordenar por productos nuevos
ProductSchema.index({ createdAt: -1 });

// Índice compuesto para listados ecommerce por categoría y disponibilidad
ProductSchema.index({
  categoryId: 1,
  availability: 1,
  createdAt: -1,
});
