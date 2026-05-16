import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessSettingsRepository } from './business-settings.repository';
import {
  BusinessColorPaletteModel,
  BusinessExtraFieldModel,
  BusinessSettingsModel,
} from './models/business-settings.model';

const DEFAULT_LOGO_URL = '/placeholder.webp';
const DEFAULT_COLOR_PALETTE: BusinessColorPaletteModel = {
  preset: 'pink',
  brand50: '#fdf2f8',
  brand100: '#fce7f3',
  brand200: '#fbcfe8',
  brand300: '#f9a8d4',
  brand400: '#f472b6',
  brand500: '#ec4899',
  brand600: '#db2777',
  brand700: '#be185d',
  brand800: '#9d174d',
  brand900: '#831843',
  brand950: '#500724',
};
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_PICKUP_ADDRESS = '';
const DEFAULT_CHECKOUT_DISABLED_MESSAGE =
  'Ya puedes explorar la tienda, guardar favoritos y usar el carrito. La compra estara disponible cuando activemos los pagos.';
const DEFAULT_DELIVERY_DISABLED_MESSAGE =
  'El envio a domicilio estara disponible proximamente.';
const DEFAULT_PAYMENT_INSTRUCTIONS = [
  'Realiza el pago por transferencia o deposito a la cuenta indicada por la tienda.',
  'Luego carga el comprobante y el numero de operacion en tu pedido.',
  'El pedido quedara en espera hasta que administracion confirme que el pago entro en la cuenta.',
];
const DEFAULT_SEO_DESCRIPTION =
  'Compra productos seleccionados en nuestra tienda online.';
const DEFAULT_ABOUT_TEXT =
  'Conoce mas sobre nuestra tienda, productos y forma de atender cada compra.';

type UpdateBusinessSettingsModel = Partial<
  Omit<BusinessSettingsModel, 'colorPalette'>
> & {
  colorPalette?: Partial<BusinessColorPaletteModel>;
};

@Injectable()
export class BusinessSettingsService {
  constructor(
    private readonly repository: BusinessSettingsRepository,
    private readonly configService: ConfigService,
  ) {}

  private fallbackSettings(): BusinessSettingsModel {
    return {
      businessName:
        this.configService.get<string>('BUSINESS_NAME')?.trim() ||
        'Tienda online',
      legalName:
        this.configService.get<string>('BUSINESS_LEGAL_NAME')?.trim() || '',
      email: this.configService.get<string>('BUSINESS_EMAIL')?.trim() || '',
      phone: this.configService.get<string>('BUSINESS_PHONE')?.trim() || '',
      address: this.configService.get<string>('BUSINESS_ADDRESS')?.trim() || '',
      city: this.configService.get<string>('BUSINESS_CITY')?.trim() || '',
      state: this.configService.get<string>('BUSINESS_STATE')?.trim() || '',
      country: this.configService.get<string>('BUSINESS_COUNTRY')?.trim() || '',
      logoUrl:
        this.configService.get<string>('BUSINESS_LOGO_URL')?.trim() ||
        DEFAULT_LOGO_URL,
      logoPublicId: null,
      extraFields: [],
      colorPalette: DEFAULT_COLOR_PALETTE,
      paymentsEnabled:
        this.configService.get<string>('PAYMENTS_ENABLED')?.trim() !== 'false',
      checkoutDisabledMessage:
        this.configService.get<string>('CHECKOUT_DISABLED_MESSAGE')?.trim() ||
        DEFAULT_CHECKOUT_DISABLED_MESSAGE,
      storePickupAddress:
        this.configService.get<string>('STORE_PICKUP_ADDRESS')?.trim() ||
        DEFAULT_PICKUP_ADDRESS,
      pickupMessage:
        this.configService.get<string>('PICKUP_MESSAGE')?.trim() ||
        'Retiro en tienda disponible.',
      deliveryEnabled:
        this.configService.get<string>('DELIVERY_ENABLED')?.trim() === 'true',
      deliveryDisabledMessage:
        this.configService.get<string>('DELIVERY_DISABLED_MESSAGE')?.trim() ||
        DEFAULT_DELIVERY_DISABLED_MESSAGE,
      manualPaymentInstructions:
        this.configService
          .get<string>('MANUAL_PAYMENT_INSTRUCTIONS')
          ?.split('|')
          .map((item) => item.trim())
          .filter(Boolean) || DEFAULT_PAYMENT_INSTRUCTIONS,
      seoTitle:
        this.configService.get<string>('BUSINESS_SEO_TITLE')?.trim() ||
        this.configService.get<string>('BUSINESS_NAME')?.trim() ||
        'Tienda online',
      seoDescription:
        this.configService.get<string>('BUSINESS_SEO_DESCRIPTION')?.trim() ||
        DEFAULT_SEO_DESCRIPTION,
      ogImageUrl:
        this.configService.get<string>('BUSINESS_OG_IMAGE_URL')?.trim() ||
        '/placeholder.webp',
      instagramUrl:
        this.configService.get<string>('BUSINESS_INSTAGRAM_URL')?.trim() || '',
      aboutTitle:
        this.configService.get<string>('BUSINESS_ABOUT_TITLE')?.trim() ||
        'Acerca de la tienda',
      aboutText:
        this.configService.get<string>('BUSINESS_ABOUT_TEXT')?.trim() ||
        DEFAULT_ABOUT_TEXT,
      aboutImageUrl:
        this.configService.get<string>('BUSINESS_ABOUT_IMAGE_URL')?.trim() ||
        '/placeholder.webp',
    };
  }

  private normalizeExtraFields(
    fields?: BusinessExtraFieldModel[] | null,
  ): BusinessExtraFieldModel[] {
    if (!Array.isArray(fields)) return [];

    return fields
      .map((field) => ({
        label: String(field?.label ?? '').trim(),
        value: String(field?.value ?? '').trim(),
      }))
      .filter((field) => field.label || field.value)
      .slice(0, 20);
  }

  private normalizeSettings(
    settings: Partial<BusinessSettingsModel> | null,
  ): BusinessSettingsModel {
    const fallback = this.fallbackSettings();

    return {
      id: settings?.id,
      businessName: String(
        settings?.businessName || fallback.businessName,
      ).trim(),
      legalName: String(settings?.legalName ?? fallback.legalName).trim(),
      email: String(settings?.email ?? fallback.email).trim(),
      phone: String(settings?.phone ?? fallback.phone).trim(),
      address: String(settings?.address ?? fallback.address).trim(),
      city: String(settings?.city ?? fallback.city).trim(),
      state: String(settings?.state ?? fallback.state).trim(),
      country: String(settings?.country ?? fallback.country).trim(),
      logoUrl: String(settings?.logoUrl || fallback.logoUrl).trim(),
      logoPublicId: settings?.logoPublicId?.trim() || null,
      extraFields: this.normalizeExtraFields(settings?.extraFields),
      colorPalette: this.normalizeColorPalette(settings?.colorPalette),
      paymentsEnabled:
        typeof settings?.paymentsEnabled === 'boolean'
          ? settings.paymentsEnabled
          : fallback.paymentsEnabled,
      checkoutDisabledMessage: String(
        settings?.checkoutDisabledMessage || fallback.checkoutDisabledMessage,
      ).trim(),
      storePickupAddress: String(
        settings?.storePickupAddress || fallback.storePickupAddress,
      ).trim(),
      pickupMessage: String(
        settings?.pickupMessage || fallback.pickupMessage,
      ).trim(),
      deliveryEnabled:
        typeof settings?.deliveryEnabled === 'boolean'
          ? settings.deliveryEnabled
          : fallback.deliveryEnabled,
      deliveryDisabledMessage: String(
        settings?.deliveryDisabledMessage || fallback.deliveryDisabledMessage,
      ).trim(),
      manualPaymentInstructions: Array.isArray(
        settings?.manualPaymentInstructions,
      )
        ? settings.manualPaymentInstructions
            .map((item) => String(item ?? '').trim())
            .filter(Boolean)
            .slice(0, 12)
        : fallback.manualPaymentInstructions,
      seoTitle: String(settings?.seoTitle || fallback.seoTitle).trim(),
      seoDescription: String(
        settings?.seoDescription || fallback.seoDescription,
      ).trim(),
      ogImageUrl: String(settings?.ogImageUrl || fallback.ogImageUrl).trim(),
      instagramUrl: String(
        settings?.instagramUrl || fallback.instagramUrl,
      ).trim(),
      aboutTitle: String(settings?.aboutTitle || fallback.aboutTitle).trim(),
      aboutText: String(settings?.aboutText || fallback.aboutText).trim(),
      aboutImageUrl: String(
        settings?.aboutImageUrl || fallback.aboutImageUrl,
      ).trim(),
      createdAt: settings?.createdAt,
      updatedAt: settings?.updatedAt,
    };
  }

  private normalizeColorPalette(
    palette?: Partial<BusinessColorPaletteModel> | null,
  ): BusinessColorPaletteModel {
    const getColor = (key: keyof Omit<BusinessColorPaletteModel, 'preset'>) => {
      const value = String(palette?.[key] ?? '').trim();
      return HEX_COLOR_PATTERN.test(value) ? value : DEFAULT_COLOR_PALETTE[key];
    };

    return {
      preset: String(palette?.preset || DEFAULT_COLOR_PALETTE.preset).trim(),
      brand50: getColor('brand50'),
      brand100: getColor('brand100'),
      brand200: getColor('brand200'),
      brand300: getColor('brand300'),
      brand400: getColor('brand400'),
      brand500: getColor('brand500'),
      brand600: getColor('brand600'),
      brand700: getColor('brand700'),
      brand800: getColor('brand800'),
      brand900: getColor('brand900'),
      brand950: getColor('brand950'),
    };
  }

  async getSettings(): Promise<BusinessSettingsModel> {
    const existing = await this.repository.findMain();

    if (existing) {
      return this.normalizeSettings(existing);
    }

    return this.repository.upsertMain(this.fallbackSettings());
  }

  async updateSettings(
    input: UpdateBusinessSettingsModel,
  ): Promise<BusinessSettingsModel> {
    const current = await this.getSettings();
    const next = this.normalizeSettings({
      ...current,
      ...input,
      extraFields:
        input.extraFields !== undefined
          ? input.extraFields
          : current.extraFields,
      logoPublicId:
        input.logoPublicId !== undefined
          ? input.logoPublicId
          : current.logoPublicId,
      colorPalette:
        input.colorPalette !== undefined
          ? {
              ...current.colorPalette,
              ...input.colorPalette,
            }
          : current.colorPalette,
    });

    return this.repository.upsertMain(next);
  }
}
