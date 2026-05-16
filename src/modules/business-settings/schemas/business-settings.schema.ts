import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { exposeIdAndHideVersion } from '../../../common/mongoose/transforms';

export class BusinessExtraField {
  @Prop({ required: true, trim: true })
  label!: string;

  @Prop({ type: String, trim: true, default: '' })
  value!: string;
}

export class BusinessColorPalette {
  @Prop({ type: String, trim: true, default: 'pink' })
  preset!: string;

  @Prop({ type: String, trim: true, default: '#fdf2f8' })
  brand50!: string;

  @Prop({ type: String, trim: true, default: '#fce7f3' })
  brand100!: string;

  @Prop({ type: String, trim: true, default: '#fbcfe8' })
  brand200!: string;

  @Prop({ type: String, trim: true, default: '#f9a8d4' })
  brand300!: string;

  @Prop({ type: String, trim: true, default: '#f472b6' })
  brand400!: string;

  @Prop({ type: String, trim: true, default: '#ec4899' })
  brand500!: string;

  @Prop({ type: String, trim: true, default: '#db2777' })
  brand600!: string;

  @Prop({ type: String, trim: true, default: '#be185d' })
  brand700!: string;

  @Prop({ type: String, trim: true, default: '#9d174d' })
  brand800!: string;

  @Prop({ type: String, trim: true, default: '#831843' })
  brand900!: string;

  @Prop({ type: String, trim: true, default: '#500724' })
  brand950!: string;
}

@Schema({ timestamps: true })
export class BusinessSettings {
  @Prop({ required: true, unique: true, default: 'main' })
  key!: string;

  @Prop({ required: true, trim: true, default: 'Tienda online' })
  businessName!: string;

  @Prop({ type: String, trim: true, default: '' })
  legalName!: string;

  @Prop({ type: String, trim: true, default: '' })
  email!: string;

  @Prop({ type: String, trim: true, default: '' })
  phone!: string;

  @Prop({ type: String, trim: true, default: '' })
  address!: string;

  @Prop({ type: String, trim: true, default: '' })
  city!: string;

  @Prop({ type: String, trim: true, default: '' })
  state!: string;

  @Prop({ type: String, trim: true, default: '' })
  country!: string;

  @Prop({ type: String, trim: true, default: '' })
  logoUrl!: string;

  @Prop({ type: String, trim: true, default: null })
  logoPublicId?: string | null;

  @Prop({ type: [BusinessExtraField], default: [] })
  extraFields!: BusinessExtraField[];

  @Prop({ type: BusinessColorPalette, default: () => ({}) })
  colorPalette!: BusinessColorPalette;

  @Prop({ type: Boolean, default: true })
  paymentsEnabled!: boolean;

  @Prop({
    type: String,
    trim: true,
    default:
      'Ya puedes explorar la tienda, guardar favoritos y usar el carrito. La compra estara disponible cuando activemos los pagos.',
  })
  checkoutDisabledMessage!: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  storePickupAddress!: string;

  @Prop({
    type: String,
    trim: true,
    default: 'Retiro en tienda disponible.',
  })
  pickupMessage!: string;

  @Prop({ type: Boolean, default: false })
  deliveryEnabled!: boolean;

  @Prop({
    type: String,
    trim: true,
    default: 'El envio a domicilio estara disponible proximamente.',
  })
  deliveryDisabledMessage!: string;

  @Prop({
    type: [String],
    default: [
      'Realiza el pago por transferencia o deposito a la cuenta indicada por la tienda.',
      'Luego carga el comprobante y el numero de operacion en tu pedido.',
      'El pedido quedara en espera hasta que administracion confirme que el pago entro en la cuenta.',
    ],
  })
  manualPaymentInstructions!: string[];

  @Prop({ type: String, trim: true, default: 'Tienda online' })
  seoTitle!: string;

  @Prop({
    type: String,
    trim: true,
    default: 'Compra productos seleccionados en nuestra tienda online.',
  })
  seoDescription!: string;

  @Prop({ type: String, trim: true, default: '/placeholder.webp' })
  ogImageUrl!: string;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  instagramUrl!: string;

  @Prop({ type: String, trim: true, default: 'Acerca de la tienda' })
  aboutTitle!: string;

  @Prop({
    type: String,
    trim: true,
    default:
      'Conoce mas sobre nuestra tienda, productos y forma de atender cada compra.',
  })
  aboutText!: string;

  @Prop({ type: String, trim: true, default: '/placeholder.webp' })
  aboutImageUrl!: string;
}

export type BusinessSettingsDocument = HydratedDocument<BusinessSettings>;
export const BusinessSettingsSchema =
  SchemaFactory.createForClass(BusinessSettings);

BusinessSettingsSchema.set('toObject', { transform: exposeIdAndHideVersion });
BusinessSettingsSchema.set('toJSON', { transform: exposeIdAndHideVersion });
