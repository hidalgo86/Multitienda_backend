import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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

CartSchema.set('toJSON', {
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
