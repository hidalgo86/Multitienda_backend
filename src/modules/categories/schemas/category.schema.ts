import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  })
  slug!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', default: null })
  parent?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: '' })
  description!: string;

  @Prop({ type: String, trim: true, default: '' })
  imageUrl!: string;

  @Prop({ type: String, trim: true, default: null })
  imagePublicId?: string | null;

  @Prop({ type: Boolean, default: false, index: true })
  isFeatured!: boolean;

  @Prop({ type: Number, default: 0, index: true })
  displayOrder!: number;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ parent: 1, name: 1 });
CategorySchema.index({ isFeatured: 1, displayOrder: 1 });
