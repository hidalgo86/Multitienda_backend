import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessSettingsService } from '@/modules/business-settings/business-settings.service';
import { Resend } from 'resend';

export interface EmailDebugInfo {
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string | null;
  from: string | null;
  passConfigured: boolean;
  passLength: number;
  transporterReady: boolean;
}

export interface EmailSendDebugResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  debug: EmailDebugInfo;
}

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly emailFrom: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly businessSettingsService: BusinessSettingsService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.emailFrom = this.configService.get<string>('EMAIL_FROM');

    if (!apiKey || !this.emailFrom) {
      this.logger.error(
        'La configuracion de email esta incompleta. Falta RESEND_API_KEY o EMAIL_FROM.',
      );
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.logger.log('Servicio de email inicializado con Resend.');
    } catch (error) {
      this.logger.error('Error al crear el cliente de Resend:', error);
      this.resend = null;
    }
  }

  getEmailDebugInfo(): EmailDebugInfo {
    const apiKey = this.configService.get<string>('RESEND_API_KEY') ?? '';
    const from = this.configService.get<string>('EMAIL_FROM') ?? null;

    return {
      host: 'api.resend.com',
      port: 443,
      secure: true,
      user: 'resend',
      from,
      passConfigured: apiKey.length > 0,
      passLength: apiKey.length,
      transporterReady: this.resend !== null,
    };
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<EmailSendDebugResult> {
    const resend = this.resend;
    const debug = this.getEmailDebugInfo();

    if (!resend || !this.emailFrom) {
      const error =
        'El cliente de Resend no esta inicializado (revisa RESEND_API_KEY y EMAIL_FROM).';
      this.logger.error(`No se puede enviar email a ${to}. ${error}`);
      return {
        ok: false,
        error,
        debug,
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: this.emailFrom,
        to: [to],
        subject,
        html,
      });

      if (error) {
        const errorMessage =
          typeof error.message === 'string'
            ? error.message
            : 'Error desconocido al enviar email con Resend';
        this.logger.error(`Fallo al enviar correo a ${to}: ${errorMessage}`);
        return {
          ok: false,
          error: errorMessage,
          debug,
        };
      }

      this.logger.log(
        `Correo enviado a ${to}. Message ID: ${data?.id ?? 'sin-id'}`,
      );
      return {
        ok: true,
        messageId: data?.id,
        debug,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error desconocido al enviar email';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Fallo al enviar correo a ${to}`, stack);
      return {
        ok: false,
        error: errorMessage,
        debug,
      };
    }
  }

  private async getBrandContext(): Promise<{
    brandName: string;
    brandTeam: string;
    logoUrl: string;
  }> {
    const settings = await this.businessSettingsService.getSettings();
    const brandName = settings.businessName.trim() || 'Tu tienda';
    const rawLogoUrl = settings.logoUrl.trim();
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') ?? ''
    ).replace(/\/+$/, '');
    const logoUrl =
      rawLogoUrl && rawLogoUrl.startsWith('/') && frontendUrl
        ? `${frontendUrl}${rawLogoUrl}`
        : rawLogoUrl;

    return {
      brandName,
      brandTeam: `El equipo de ${brandName}`,
      logoUrl,
    };
  }

  async sendVerificationEmailWithDebug(
    to: string,
    name: string,
    code: string,
  ): Promise<EmailSendDebugResult> {
    const brand = await this.getBrandContext();

    return this.sendEmail(
      to,
      `Verifica tu cuenta en ${brand.brandName}`,
      `
        ${brand.logoUrl ? `<p><img src="${brand.logoUrl}" alt="${brand.brandName}" style="max-width: 180px; height: auto;" /></p>` : ''}
        <h1>Hola ${name}!</h1>
        <p>Gracias por registrarte en ${brand.brandName}.</p>
        <p>Tu codigo de verificacion es: <strong>${code}</strong></p>
        <p>Ingresa este codigo en la tienda online para activar tu cuenta.</p>
        <br>
        <p>Si tu no creaste esta cuenta, puedes ignorar este mensaje.</p>
        <p>Saludos,<br>${brand.brandTeam}</p>
      `,
    );
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const result = await this.sendVerificationEmailWithDebug(to, name, code);
    if (!result.ok) {
      throw new Error(result.error ?? 'No se pudo enviar el correo');
    }
  }

  async forgotUsername(
    to: string,
    username: string,
  ): Promise<{ message: string }> {
    const brand = await this.getBrandContext();

    const result = await this.sendEmail(
      to,
      `Recupera tu nombre de usuario en ${brand.brandName}`,
      `
        ${brand.logoUrl ? `<p><img src="${brand.logoUrl}" alt="${brand.brandName}" style="max-width: 180px; height: auto;" /></p>` : ''}
        <h1>Hola!</h1>
        <p>Tu nombre de usuario es: <strong>${username}</strong></p>
        <p>Si no solicitaste este correo, ignoralo.</p>
        <br>
        <p>Saludos,<br>${brand.brandTeam}</p>
      `,
    );

    if (!result.ok) {
      throw new Error(result.error ?? 'No se pudo enviar el correo');
    }

    return { message: 'Nombre de usuario enviado exitosamente' };
  }

  async forgotPassword(
    to: string,
    username: string,
    token: string,
  ): Promise<void> {
    const brand = await this.getBrandContext();
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/reset-password?username=${encodeURIComponent(
      username,
    )}&token=${encodeURIComponent(token)}`;
    const result = await this.sendEmail(
      to,
      `Recupera tu contrasena en ${brand.brandName}`,
      `
        ${brand.logoUrl ? `<p><img src="${brand.logoUrl}" alt="${brand.brandName}" style="max-width: 180px; height: auto;" /></p>` : ''}
        <h1>Hola ${username}!</h1>
        <p>Si has olvidado tu contrasena</p>
        <br>
        <p>Para restablecer tu contrasena, haz clic en el siguiente enlace:</p>
        <p><a href="${resetUrl}">Restablecer contrasena</a></p>
        <p>Si no puedes hacer clic en el enlace, copia y pega la siguiente URL en tu navegador:</p>
        <p>${resetUrl}</p>
        <br>
        <p>Si no solicitaste este correo, ignoralo.</p>
        <br>
        <p>Saludos,<br>${brand.brandTeam}</p>
      `,
    );

    if (!result.ok) {
      throw new Error(result.error ?? 'No se pudo enviar el correo');
    }
  }

  async sendAccountDeletionCode(
    to: string,
    username: string,
    code: string,
  ): Promise<void> {
    const brand = await this.getBrandContext();

    const result = await this.sendEmail(
      to,
      `Confirma la eliminacion de tu cuenta en ${brand.brandName}`,
      `
        ${brand.logoUrl ? `<p><img src="${brand.logoUrl}" alt="${brand.brandName}" style="max-width: 180px; height: auto;" /></p>` : ''}
        <h1>Hola ${username}!</h1>
        <p>Recibimos una solicitud para eliminar definitivamente tu cuenta.</p>
        <p>Tu codigo de confirmacion es: <strong>${code}</strong></p>
        <p>Este codigo caduca en 15 minutos.</p>
        <p>Si confirmas la eliminacion, perderas acceso a tu cuenta, perfil, carrito y favoritos.</p>
        <p>Si no solicitaste esta accion, ignora este mensaje y cambia tu contrasena.</p>
        <br>
        <p>Saludos,<br>${brand.brandTeam}</p>
      `,
    );

    if (!result.ok) {
      throw new Error(result.error ?? 'No se pudo enviar el correo');
    }
  }
}
