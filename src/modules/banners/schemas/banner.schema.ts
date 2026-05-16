import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Banner {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  imageUrl!: string;

  @Prop({ type: String, trim: true, default: null })
  imagePublicId?: string | null;

  @Prop({ type: String, trim: true, default: '' })
  altText!: string;

  @Prop({ type: String, trim: true, default: '' })
  subtitle!: string;

  @Prop({ type: String, trim: true, default: null })
  linkUrl?: string | null;

  @Prop({ type: String, trim: true, default: '' })
  ctaLabel!: string;

  @Prop({ default: 0, index: true })
  order!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null, index: true })
  startsAt?: Date | null;

  @Prop({ type: Date, default: null, index: true })
  endsAt?: Date | null;
}

export type BannerDocument = HydratedDocument<Banner>;
export const BannerSchema = SchemaFactory.createForClass(Banner);

BannerSchema.set('toObject', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    if (ret && typeof ret === 'object' && '_id' in ret) {
      const id = (ret as { _id?: unknown })._id;
      (ret as { id?: string }).id = typeof id === 'string' ? id : String(id);
      delete (ret as { _id?: unknown })._id;
    }
    delete (ret as { __v?: unknown }).__v;
    return ret;
  },
});

BannerSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    if (ret && typeof ret === 'object' && '_id' in ret) {
      const id = (ret as { _id?: unknown })._id;
      (ret as { id?: string }).id = typeof id === 'string' ? id : String(id);
      delete (ret as { _id?: unknown })._id;
    }
    delete (ret as { __v?: unknown }).__v;
    return ret;
  },
});
