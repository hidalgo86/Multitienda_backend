import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoriesSeed {
  private readonly logger = new Logger(CategoriesSeed.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    try {
      if (this.configService.get<string>('SEED_CATEGORIES') === 'false') {
        this.logger.log('Seed de categorias desactivado por configuracion');
        return;
      }

      const count = await this.categoryModel.countDocuments().exec();

      if (count > 0) {
        this.logger.log('Categorias ya existen en la base de datos');
        return;
      }

      const configuredCategories = this.parseConfiguredCategories();
      const defaultCategories =
        configuredCategories.length > 0
          ? configuredCategories
          : [
              {
                name: 'Ropa Bebe',
                slug: 'ropa-bebe',
                description: 'Prendas comodas para bebes.',
                isFeatured: true,
                displayOrder: 1,
              },
              {
                name: 'Ropa Infantil',
                slug: 'ropa-infantil',
                description: 'Ropa para ninos y ninas.',
                isFeatured: true,
                displayOrder: 2,
              },
              {
                name: 'Juguetes',
                slug: 'juguetes',
                description: 'Ideas para regalar, aprender y jugar.',
                isFeatured: true,
                displayOrder: 3,
              },
              {
                name: 'Accesorios',
                slug: 'accesorios',
                description: 'Detalles utiles para el dia a dia.',
                isFeatured: true,
                displayOrder: 4,
              },
            ];

      const created = await this.categoryModel.insertMany(defaultCategories);
      this.logger.log(`Seed completado: ${created.length} categorias creadas`);

      created.forEach((cat) => {
        this.logger.log(`  - ${cat.name} (${cat.slug})`);
      });
    } catch (error) {
      this.logger.error('Error en seed de categorias', error);
      throw error;
    }
  }

  private parseConfiguredCategories(): Partial<Category>[] {
    const raw = this.configService
      .get<string>('DEFAULT_CATEGORIES_JSON')
      ?.trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];

      const categories: Partial<Category>[] = [];

      parsed.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const name = typeof record.name === 'string' ? record.name.trim() : '';
        const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
        if (!name || !slug) return;

        categories.push({
          name,
          slug,
          description:
            typeof record.description === 'string'
              ? record.description.trim()
              : '',
          imageUrl:
            typeof record.imageUrl === 'string' ? record.imageUrl.trim() : '',
          isFeatured: record.isFeatured === true,
          displayOrder:
            typeof record.displayOrder === 'number' ? record.displayOrder : 0,
        });
      });

      return categories;
    } catch (error) {
      this.logger.warn(
        `DEFAULT_CATEGORIES_JSON invalido: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return [];
    }
  }
}
