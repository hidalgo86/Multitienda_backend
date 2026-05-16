import { Injectable } from '@nestjs/common';
import { EmailDebugInfo, EmailSendDebugResult } from './email.service';

@Injectable()
export class MockMailService {
  public lastEmail: string | null = null;
  public lastUsername: string | null = null;
  public lastCode: string | null = null;

  private getDebugInfo(): EmailDebugInfo {
    return {
      host: 'api.resend.com',
      port: 443,
      secure: true,
      user: 'resend',
      from: 'test@example.com',
      passConfigured: true,
      passLength: 10,
      transporterReady: true,
    };
  }

  sendVerificationEmailWithDebug(
    email: string,
    username: string,
    code: string,
  ): Promise<EmailSendDebugResult> {
    this.lastEmail = email;
    this.lastUsername = username;
    this.lastCode = code;

    return Promise.resolve({
      ok: true,
      messageId: 'mock-message-id',
      debug: this.getDebugInfo(),
    });
  }

  sendVerificationEmail(
    email: string,
    username: string,
    code: string,
  ): Promise<void> {
    this.lastEmail = email;
    this.lastUsername = username;
    this.lastCode = code;
    return Promise.resolve();
  }

  forgotUsername(
    email: string,
    username: string,
  ): Promise<{ message: string }> {
    this.lastEmail = email;
    this.lastUsername = username;
    return Promise.resolve({
      message: 'Nombre de usuario enviado exitosamente',
    });
  }

  forgotPassword(email: string, username: string, code: string): Promise<void> {
    this.lastEmail = email;
    this.lastUsername = username;
    this.lastCode = code;
    return Promise.resolve();
  }

  sendAccountDeletionCode(
    email: string,
    username: string,
    code: string,
  ): Promise<void> {
    this.lastEmail = email;
    this.lastUsername = username;
    this.lastCode = code;
    return Promise.resolve();
  }
}
