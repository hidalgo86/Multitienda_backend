import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

// Common
import { EmailService } from '@/common/email/email.service';
import { handleServiceError } from '@/common/exceptions/error-handler.util';

// Utils
import { comparePassword, hashPassword } from './utils/hash.util';
import {
  generatePasswordResetToken,
  generateVerificationCode,
} from './utils/auth.util';

// Models de Auth
import { AuthModel } from './models/auth.model';
import { RegisterUserModel } from './models/registerUser.model';
import { LoginRequestModel } from './models/loginRequest.model';
import { VerifyEmailModel } from './models/verifyEmail.model';
import { ResetPasswordModel } from './models/resetPassword.model';
import { ChangePasswordModel } from './models/changePassword.model';
import { JwtPayload } from './models/jwt-payload.interface';
import { AuthUserModel } from '../users/model/auth-user.model';
import { UserStatus } from '../users/schemas/users.schema';
import { CartsService } from '../cart/carts.service';
import { FavoritesService } from '../favorites/favorites.service';

interface RegisterUserResponse {
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private static readonly VERIFICATION_CODE_TTL_MINUTES = 15;
  private static readonly PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;
  private static readonly ACCOUNT_DELETION_CODE_TTL_MINUTES = 15;
  private static readonly RESEND_VERIFICATION_COOLDOWN_MS = 5 * 60_000;
  private static readonly ACCOUNT_DELETION_COOLDOWN_MS = 5 * 60_000;
  private static readonly ACCESS_TOKEN_TTL = '15m';
  private static readonly REFRESH_TOKEN_TTL = '7d';
  private static readonly MAX_FAILED_LOGIN_ATTEMPTS = 3;

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly cartsService: CartsService,
    private readonly favoritesService: FavoritesService,
  ) {}

  private buildTokenPayload(user: AuthUserModel): JwtPayload {
    return {
      sub: user.id,
      role: user.role,
    };
  }

  private getVerificationCodeExpirationDate(): Date {
    return new Date(
      Date.now() + AuthService.VERIFICATION_CODE_TTL_MINUTES * 60_000,
    );
  }

  private getAccountDeletionCodeExpirationDate(): Date {
    return new Date(
      Date.now() + AuthService.ACCOUNT_DELETION_CODE_TTL_MINUTES * 60_000,
    );
  }

  private ensureActiveUser(
    user: AuthUserModel,
    message: string = 'Usuario no válido',
  ): void {
    if (user.status === UserStatus.SUSPENDIDO) {
      throw new UnauthorizedException(
        'Usuario bloqueado por demasiados intentos fallidos',
      );
    }

    if (user.status !== UserStatus.ACTIVO) {
      throw new UnauthorizedException(message);
    }
  }

  private async issueAuthTokens(
    user: AuthUserModel,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = this.buildTokenPayload(user);
    const access_token = this.jwtService.sign(payload, {
      expiresIn: AuthService.ACCESS_TOKEN_TTL,
    });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: AuthService.REFRESH_TOKEN_TTL,
    });

    const refreshTokenHash = await hashPassword(refresh_token);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return { access_token, refresh_token };
  }

  // send verification email
  private async sendVerificationEmail(
    email: string,
    username: string,
    code: string,
  ) {
    try {
      await this.emailService.sendVerificationEmail(email, username, code);
      this.logger.log(`Correo de verificación enviado a ${email}`);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al enviar correo de verificación a ${email}`,
        stack,
      );
      throw new ServiceUnavailableException(
        'No se pudo enviar el correo de verificación. Inténtalo más tarde.',
      );
    }
  }

  // validate verification code
  private async validateVerificationCode(user: AuthUserModel, code: string) {
    if (!user.verificationCodeHash) {
      this.logger.warn(`Usuario ${user.id} no tiene código de verificación.`);
      throw new BadRequestException('Código de verificación no encontrado');
    }
    if (user.isEmailVerified) {
      this.logger.warn(`Usuario ${user.id} ya está verificado.`);
      throw new BadRequestException('Usuario ya verificado');
    }
    const isValidCode = await comparePassword(code, user.verificationCodeHash);
    if (!isValidCode) {
      this.logger.warn(
        `Código de verificación inválido para usuario ${user.id}`,
      );
      throw new BadRequestException('Código de verificación inválido');
    }
    if (!user.verificationCodeExpiresAt) {
      throw new BadRequestException('Código de verificación inválido');
    }
    if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('El código de verificación ha expirado');
    }
  }

  private async validateAccountDeletionCode(
    user: AuthUserModel,
    code: string,
  ): Promise<void> {
    if (!user.accountDeletionCodeHash || !user.accountDeletionCodeExpiresAt) {
      throw new BadRequestException('Codigo de eliminacion no encontrado');
    }

    if (user.accountDeletionCodeExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('El codigo de eliminacion ha expirado');
    }

    const isValidCode = await comparePassword(
      code,
      user.accountDeletionCodeHash,
    );

    if (!isValidCode) {
      throw new BadRequestException('Codigo de eliminacion invalido');
    }
  }

  // Register user
  async registerUser(input: RegisterUserModel): Promise<RegisterUserResponse> {
    try {
      const existingByEmail = await this.usersService
        .getUserByEmail(input.email)
        .catch(() => null);
      if (existingByEmail) {
        throw new ConflictException('Ya existe un usuario con este email');
      }

      const existingByUsername = await this.usersService
        .getUserByUsername(input.username)
        .catch(() => null);
      if (existingByUsername) {
        throw new ConflictException('Ya existe un usuario con este username');
      }

      const now = new Date();
      const password = await hashPassword(input.password);
      const verificationCode = generateVerificationCode();
      const verificationCodeHash = await hashPassword(verificationCode);
      const verificationCodeExpiresAt =
        this.getVerificationCodeExpirationDate();

      const newUser = await this.usersService.createUser({
        ...input,
        password,
        verificationCodeHash,
        verificationCodeExpiresAt,
        lastVerificationSentAt: now,
      });
      this.logger.log(`Usuario ${newUser.email} creado exitosamente.`);

      await this.sendVerificationEmail(
        newUser.email,
        newUser.username,
        verificationCode,
      );

      return {
        message: 'Usuario registrado exitosamente',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error en el proceso de registro para ${input.email}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error en el proceso de registro');
    }
  }

  // Verify user using the code
  async verifyEmail(input: VerifyEmailModel): Promise<{ message: string }> {
    try {
      const user = await this.usersService.getAuthUserById(input.userId);
      if (!user) {
        throw new UnauthorizedException(
          'Usuario no encontrado o credenciales inválidas',
        );
      }

      this.ensureActiveUser(user);
      await this.validateVerificationCode(user, input.code);

      await this.usersService.markEmailAsVerified(input.userId);
      this.logger.log(`Usuario ${input.userId} verificado exitosamente.`);

      return { message: 'Usuario verificado exitosamente' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al verificar el usuario ${input.userId}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error al verificar el usuario');
    }
  }

  // Resend verification email
  async resendVerifyEmail(userId: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService.getAuthUserById(userId);
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      this.ensureActiveUser(user);
      if (user.isEmailVerified) {
        return { message: 'Usuario ya verificado' };
      }

      const now = new Date();
      if (
        user.lastVerificationSentAt &&
        now.getTime() - new Date(user.lastVerificationSentAt).getTime() <
          AuthService.RESEND_VERIFICATION_COOLDOWN_MS
      ) {
        throw new BadRequestException(
          'Debes esperar 5 minutos antes de solicitar otro código.',
        );
      }

      const newVerificationCode = generateVerificationCode();
      const newVerificationCodeHash = await hashPassword(newVerificationCode);
      const verificationCodeExpiresAt =
        this.getVerificationCodeExpirationDate();

      await this.usersService.updateAuthVerificationState(
        userId,
        newVerificationCodeHash,
        now,
        verificationCodeExpiresAt,
      );

      this.logger.log(
        `Nuevo código de verificación generado para ${user.email}.`,
      );

      await this.sendVerificationEmail(
        user.email,
        user.username,
        newVerificationCode,
      );

      this.logger.log(`Código de verificación reenviado a ${user.email}.`);
      return { message: 'Código de verificación reenviado exitosamente' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al reenviar el código de verificación para el usuario ${userId}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error al reenviar el código de verificación');
    }
  }

  // Login user
  async login(loginRequest: LoginRequestModel): Promise<AuthModel> {
    try {
      const authUser = await this.usersService.getAuthUserByUsername(
        loginRequest.username,
      );
      if (!authUser) {
        this.logger.warn(
          `Intento de login fallido para el usuario ${loginRequest.username}: usuario no encontrado.`,
        );
        throw new UnauthorizedException('Credenciales inválidas');
      }

      this.ensureActiveUser(authUser);
      const isPasswordValid = await comparePassword(
        loginRequest.password,
        authUser.password,
      );

      if (!isPasswordValid) {
        const failedAttempts = (authUser.failedLoginAttempts ?? 0) + 1;
        const shouldSuspend =
          failedAttempts > AuthService.MAX_FAILED_LOGIN_ATTEMPTS;
        await this.usersService.recordFailedLoginAttempt(
          authUser.id,
          shouldSuspend,
        );

        this.logger.warn(
          `Intento de login fallido para el usuario ${loginRequest.username}: contraseña inválida.`,
        );
        if (shouldSuspend) {
          throw new UnauthorizedException(
            'Usuario bloqueado por demasiados intentos fallidos',
          );
        }
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if ((authUser.failedLoginAttempts ?? 0) > 0) {
        await this.usersService.resetFailedLoginAttempts(authUser.id);
      }

      const tokens = await this.issueAuthTokens(authUser);
      const user = await this.usersService.getUserById(authUser.id);

      this.logger.log(`Usuario ${authUser.id} ha iniciado sesión.`);

      return {
        user,
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(msg, stack);
      handleServiceError(error, 'Error al iniciar sesión');
    }
  }

  // Refresh access token
  async refreshToken(
    refresh_token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refresh_token);

      const user = await this.usersService.getAuthUserById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVO) {
        throw new UnauthorizedException('Usuario no válido');
      }

      if (!user.refreshTokenHash) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const isRefreshTokenValid = await comparePassword(
        refresh_token,
        user.refreshTokenHash,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      return this.issueAuthTokens(user);
    } catch (error) {
      const name =
        error && typeof error === 'object' && 'name' in error
          ? (error as { name?: unknown }).name
          : undefined;
      if (name === 'TokenExpiredError') {
        throw new UnauthorizedException('El refresh token ha expirado');
      }
      if (name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Refresh token inválido');
      }
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error al refrescar el token: ${msg}`, stack);
      handleServiceError(error, 'Error al refrescar el token');
    }
  }

  // Forgot username
  async forgotUsername(email: string): Promise<{ message: string }> {
    try {
      let user: { email: string; username: string; status: UserStatus } | null =
        null;

      try {
        user = await this.usersService.getUserByEmail(email);
      } catch {
        // No revelamos existencia de la cuenta
      }

      if (user && user.status === UserStatus.ACTIVO) {
        await this.emailService.forgotUsername(user.email, user.username);
        this.logger.log(`Recovery email sent to ${user.email}.`);
      }

      return {
        message:
          'Se ha enviado un correo de recuperación de nombre de usuario.',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing username recovery for ${email}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error sending recovery email');
    }
  }

  // forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService
        .getAuthUserByEmail(email)
        .catch(() => null);

      if (!user) {
        return { message: 'Correo de recuperación de contraseña enviado' };
      }

      if (user.status !== UserStatus.ACTIVO) {
        this.logger.warn(`Usuario no válido: ${email}`);
        throw new UnauthorizedException('Usuario no válido');
      }

      const token = generatePasswordResetToken();
      const tokenHash = await hashPassword(token);
      const expiresAt = new Date(
        Date.now() + AuthService.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000,
      );

      await this.usersService.updatePasswordResetState(
        user.id,
        tokenHash,
        expiresAt,
      );

      await this.emailService.forgotPassword(user.email, user.username, token);
      this.logger.log(
        `Correo de recuperación de contraseña enviado a ${user.email}.`,
      );

      return { message: 'Correo de recuperación de contraseña enviado' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al enviar el correo de recuperación de contraseña a ${email}: ${msg}`,
        stack,
      );
      handleServiceError(
        error,
        'Error al enviar el correo de recuperación de contraseña',
      );
    }
  }

  // reset password
  async resetPassword(
    resetPasswordModel: ResetPasswordModel,
  ): Promise<{ message: string }> {
    const { username, token, newPassword } = resetPasswordModel;
    let userId: string | null = null;
    try {
      const user = await this.usersService.getAuthUserByUsername(username);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      userId = user.id;

      if (user.status !== UserStatus.ACTIVO) {
        this.logger.warn(`El usuario ${user.id} no está activo.`);
        throw new BadRequestException('Usuario no válido');
      }

      if (
        !user.passwordResetTokenHash ||
        !user.passwordResetTokenExpiresAt ||
        user.passwordResetTokenExpiresAt.getTime() < Date.now()
      ) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

      const isValidToken = await comparePassword(
        token,
        user.passwordResetTokenHash,
      );
      if (!isValidToken) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

      const isSamePassword = await comparePassword(newPassword, user.password);
      if (isSamePassword) {
        throw new BadRequestException(
          'La nueva contraseña no puede ser igual a la actual',
        );
      }

      const hashedNewPassword = await hashPassword(newPassword);

      await this.usersService.resetPasswordCredentials(
        user.id,
        hashedNewPassword,
      );
      this.logger.log(`Contraseña del usuario ${user.id} restablecida.`);

      return { message: 'Contraseña restablecida exitosamente' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al restablecer la contraseña del usuario ${userId ?? 'desconocido'}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error al restablecer la contraseña');
    }
  }

  // change password
  async changePassword(
    changePasswordModel: ChangePasswordModel,
  ): Promise<{ message: string }> {
    const { userId, oldPassword, newPassword } = changePasswordModel;
    try {
      const user = await this.usersService.getAuthUserById(userId);

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (!user.isEmailVerified || user.status !== UserStatus.ACTIVO) {
        this.logger.warn(
          `El usuario ${user.id} no es válido para cambiar la contraseña.`,
        );
        throw new BadRequestException('Usuario no válido');
      }

      const isCurrentPasswordValid = await comparePassword(
        oldPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        this.logger.warn(
          `La contraseña actual es incorrecta para el usuario ${user.id}.`,
        );
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      if (newPassword === oldPassword) {
        this.logger.warn(
          `La nueva contraseña es igual a la actual para el usuario ${user.id}.`,
        );
        throw new BadRequestException(
          'La nueva contraseña no puede ser igual a la actual',
        );
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await this.usersService.updateUserPassword(userId, hashedNewPassword);
      await this.usersService.updateRefreshTokenHash(userId, null);
      this.logger.log(`Contraseña del usuario ${userId} cambiada.`);

      return { message: 'Contraseña cambiada exitosamente' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al cambiar la contraseña del usuario ${userId}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error al cambiar la contraseña');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    try {
      await this.usersService.updateRefreshTokenHash(userId, null);
      return { message: 'Sesion cerrada' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error al cerrar sesion ${userId}: ${msg}`, stack);
      handleServiceError(error, 'Error al cerrar sesion');
    }
  }

  async requestAccountDeletion(userId: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService.getAuthUserById(userId);
      this.ensureActiveUser(user);

      const now = new Date();
      if (
        user.lastAccountDeletionSentAt &&
        now.getTime() - new Date(user.lastAccountDeletionSentAt).getTime() <
          AuthService.ACCOUNT_DELETION_COOLDOWN_MS
      ) {
        throw new BadRequestException(
          'Debes esperar 5 minutos antes de solicitar otro codigo.',
        );
      }

      const deletionCode = generateVerificationCode();
      const deletionCodeHash = await hashPassword(deletionCode);

      await this.usersService.updateAccountDeletionState(
        user.id,
        deletionCodeHash,
        this.getAccountDeletionCodeExpirationDate(),
        now,
      );

      await this.emailService.sendAccountDeletionCode(
        user.email,
        user.username,
        deletionCode,
      );

      return {
        message: 'Codigo de eliminacion enviado a tu correo',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al solicitar eliminacion de cuenta ${userId}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error al solicitar eliminacion de cuenta');
    }
  }

  async confirmAccountDeletion(
    userId: string,
    code: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.usersService.getAuthUserById(userId);
      this.ensureActiveUser(user);
      await this.validateAccountDeletionCode(user, code);

      await this.favoritesService.deleteByUserId(user.id);
      await this.cartsService.deleteByUserId(user.id);
      await this.usersService.deleteUser(user.id);

      return { message: 'Cuenta eliminada definitivamente' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al confirmar eliminacion de cuenta ${userId}: ${msg}`,
        stack,
      );
      handleServiceError(error, 'Error al eliminar la cuenta');
    }
  }
}
