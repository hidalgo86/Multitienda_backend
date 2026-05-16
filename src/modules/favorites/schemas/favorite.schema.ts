import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { exposeIdAndHideVersion } from '../../../common/mongoose/transforms';

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
  transform: exposeIdAndHideVersion,
});

FavoriteSchema.set('toJSON', {
  transform: exposeIdAndHideVersion,
});
