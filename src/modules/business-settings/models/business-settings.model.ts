export interface BusinessExtraFieldModel {
  label: string;
  value: string;
}

export interface BusinessSettingsModel {
  id?: string;
  businessName: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logoUrl: string;
  logoPublicId?: string | null;
  extraFields: BusinessExtraFieldModel[];
  colorPalette: BusinessColorPaletteModel;
  paymentsEnabled: boolean;
  checkoutDisabledMessage: string;
  storePickupAddress: string;
  pickupMessage: string;
  deliveryEnabled: boolean;
  deliveryDisabledMessage: string;
  manualPaymentInstructions: string[];
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  instagramUrl: string;
  aboutTitle: string;
  aboutText: string;
  aboutImageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BusinessColorPaletteModel {
  preset: string;
  brand50: string;
  brand100: string;
  brand200: string;
  brand300: string;
  brand400: string;
  brand500: string;
  brand600: string;
  brand700: string;
  brand800: string;
  brand900: string;
  brand950: string;
}
