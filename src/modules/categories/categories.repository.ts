import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CategoryModel } from './models/category.model';

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private idValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toHexString();
    }

    return '';
  }

  private dateValue(value: unknown): Date | undefined {
    return value instanceof Date ? value : undefined;
  }

  private normalizeCategory(raw: Record<string, unknown>): CategoryModel {
    return {
      id: this.idValue(raw._id),
      name: this.stringValue(raw.name),
      slug: this.stringValue(raw.slug),
      parentId: raw.parent ? this.idValue(raw.parent) : undefined,
      createdAt: this.dateValue(raw.createdAt),
      updatedAt: this.dateValue(raw.updatedAt),
    };
  }

  async create(data: Partial<CategoryModel>): Promise<CategoryModel> {
    const created = (
      await new this.categoryModel(data).save()
    ).toObject() as unknown as Record<string, unknown>;
    if (!created) {
      throw new Error('No se pudo crear la categoría');
    }
    return this.normalizeCategory(created);
  }

  async findById(id: string): Promise<CategoryModel | null> {
    const found = await this.categoryModel.findById(id).exec();
    if (!found) return null;
    return this.normalizeCategory(
      found.toObject() as unknown as Record<string, unknown>,
    );
  }

  async findBySlug(slug: string): Promise<CategoryModel | null> {
    const found = await this.categoryModel.findOne({ slug }).exec();
    if (!found) return null;
    return this.normalizeCategory(
      found.toObject() as unknown as Record<string, unknown>,
    );
  }

  async findAll(): Promise<CategoryModel[]> {
    const categories = await this.categoryModel.find().exec();
    return categories.map((c) =>
      this.normalizeCategory(
        c.toObject() as unknown as Record<string, unknown>,
      ),
    );
  }

  async update(
    id: string,
    data: Partial<CategoryModel>,
  ): Promise<CategoryModel | null> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
    if (!updated) return null;
    return this.normalizeCategory(
      updated.toObject() as unknown as Record<string, unknown>,
    );
  }

  async delete(id: string): Promise<CategoryModel | null> {
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) return null;
    return this.normalizeCategory(
      deleted.toObject() as unknown as Record<string, unknown>,
    );
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query: { slug: string; _id?: { $ne: string } } = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await this.categoryModel.countDocuments(query).exec();
    return count > 0;
  }
}
