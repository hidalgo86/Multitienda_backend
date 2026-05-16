import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DeliveryMethod } from '../dto/inputs/checkout.input';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  MANUAL = 'manual',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  productId!: string;

  @Prop()
  variantName?: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true })
  productName!: string;

  @Prop()
  thumbnail?: string;

  @Prop({ required: true, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, min: 0 })
  lineTotal!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddressSnapshot {
  @Prop({ required: true })
  address!: string;

  @Prop()
  name?: string;

  @Prop()
  phone?: string;
}

export const ShippingAddressSnapshotSchema = SchemaFactory.createForClass(
  ShippingAddressSnapshot,
);

@Schema({ timestamps: true })
export class Order {
  @Prop({ index: true, unique: true, sparse: true })
  orderNumber?: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount!: number;

  @Prop({ type: ShippingAddressSnapshotSchema, required: true })
  shippingAddress!: ShippingAddressSnapshot;

  @Prop({
    required: true,
    enum: DeliveryMethod,
    default: DeliveryMethod.PICKUP,
  })
  deliveryMethod!: DeliveryMethod;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Prop({
    required: true,
    enum: PaymentMethod,
    default: PaymentMethod.MANUAL,
  })
  paymentMethod!: PaymentMethod;

  @Prop()
  paymentReference?: string;

  @Prop()
  paymentReceiptNumber?: string;

  @Prop()
  paymentProofUrl?: string;

  @Prop()
  paymentProofPublicId?: string;

  @Prop()
  paymentProofSubmittedAt?: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  cancelledAt?: Date;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.set('toObject', {
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

OrderSchema.set('toJSON', {
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
