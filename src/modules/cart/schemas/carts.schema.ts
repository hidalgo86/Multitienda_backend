import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { exposeIdAndHideVersion } from '../../../common/mongoose/transforms';

@Schema({ _id: false })
export class CartItemSnapshot {
  @Prop({ required: true })
  productName!: string;

  @Prop()
  variantName?: string;

  @Prop()
  thumbnail?: string;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;
}

export const CartItemSnapshotSchema =
  SchemaFactory.createForClass(CartItemSnapshot);

@Schema({ timestamps: true })
export class Cart {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({
    type: [
      {
        productId: { type: String, required: true },
        variantName: { type: String, required: false },
        quantity: { type: Number, required: true, default: 1 },
        snapshot: {
          type: CartItemSnapshotSchema,
          required: true,
        },
      },
    ],
    default: [],
  })
  items!: {
    productId: string;
    variantName?: string;
    quantity: number;
    snapshot: {
      productName: string;
      variantName?: string;
      thumbnail?: string;
      unitPrice: number;
    };
  }[];
}

export type CartDocument = HydratedDocument<Cart>;
export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.set('toObject', {
  transform: exposeIdAndHideVersion,
});

CartSchema.set('toJSON', {
  transform: exposeIdAndHideVersion,
});
