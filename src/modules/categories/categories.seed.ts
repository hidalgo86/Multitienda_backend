import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

/**
 * Seed de categorías predefinidas para desarrollo y testing
 * Se ejecuta una sola vez al iniciar la aplicación
 */
@Injectable()
export class CategoriesSeed {
  private readonly logger = new Logger(CategoriesSeed.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async seed(): Promise<void> {
    try {
      const count = await this.categoryModel.countDocuments().exec();

      // Si ya hay categorías, no hace nada
      if (count > 0) {
        this.logger.log('Categorías ya existen en la base de datos');
        return;
      }

      const defaultCategories = [
        { name: 'Ropa Bebé', slug: 'ropa-bebe' },
        { name: 'Ropa Infantil', slug: 'ropa-infantil' },
        { name: 'Juguetes', slug: 'juguetes' },
        { name: 'Accesorios', slug: 'accesorios' },
        { name: 'Alimentación', slug: 'alimentacion' },
        { name: 'Perfumes', slug: 'perfumes' },
        { name: 'Hogar', slug: 'hogar' },
        { name: 'Electrónica', slug: 'electronica' },
      ];

      const created = await this.categoryModel.insertMany(defaultCategories);
      this.logger.log(
        `✅ Seed completado: ${created.length} categorías creadas`,
      );

      created.forEach((cat) => {
        this.logger.log(`  • ${cat.name} (${cat.slug})`);
      });
    } catch (error) {
      this.logger.error('Error en seed de categorías', error);
      throw error;
    }
  }
}
