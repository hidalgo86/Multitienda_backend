import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ type: [String], default: [] })
  products!: string[];
}

export type FavoriteDocument = HydratedDocument<Favorite>;
export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.set('toObject', {
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

FavoriteSchema.set('toJSON', {
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
