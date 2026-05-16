// src/modules/auth/auth.resolver.ts
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordInput } from './dto/inputs/change-password.input';
import { ConfirmAccountDeletionInput } from './dto/inputs/confirm-account-deletion.input';
import { EmailInput } from './dto/inputs/email.input';
import { LoginInput } from './dto/inputs/login.input';
import { RefreshTokenInput } from './dto/inputs/refresh-token.input';
import { RegisterUserInput } from './dto/inputs/register-user.input';
import { ResendVerificationInput } from './dto/inputs/resend-verification.input';
import { ResetPasswordInput } from './dto/inputs/reset-password.input';
import { VerifyEmailInput } from './dto/inputs/verify-email.input';
import { AuthType } from './dto/types/auth.type';
import { MessageResponseType } from './dto/types/message-response.type';
import { TokenResponseType } from './dto/types/token-response.type';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => MessageResponseType, {
    description: 'Registrar un nuevo usuario',
  })
  async register(
    @Args('input') input: RegisterUserInput,
  ): Promise<MessageResponseType> {
    return this.authService.registerUser(input);
  }

  @Mutation(() => MessageResponseType, {
    description: 'Verificar el correo del usuario',
  })
  async verifyEmail(
    @Args('input') input: VerifyEmailInput,
  ): Promise<MessageResponseType> {
    return this.authService.verifyEmail(input);
  }

  @Mutation(() => MessageResponseType, {
    description: 'Reenviar código de verificación',
  })
  async resendVerification(
    @Args('input') input: ResendVerificationInput,
  ): Promise<MessageResponseType> {
    return this.authService.resendVerifyEmail(input.userId);
  }

  @Mutation(() => AuthType, {
    description: 'Iniciar sesión y obtener tokens JWT',
  })
  async login(@Args('input') input: LoginInput): Promise<AuthType> {
    return this.authService.login(input);
  }

  @Mutation(() => TokenResponseType, {
    description: 'Refrescar access token y refresh token',
  })
  async refreshToken(
    @Args('input') input: RefreshTokenInput,
  ): Promise<TokenResponseType> {
    return this.authService.refreshToken(input.refresh_token);
  }

  @Mutation(() => MessageResponseType, {
    description: 'Recuperar nombre de usuario por correo',
  })
  async forgotUsername(
    @Args('input') input: EmailInput,
  ): Promise<MessageResponseType> {
    return this.authService.forgotUsername(input.email);
  }

  @Mutation(() => MessageResponseType, {
    description: 'Solicitar recuperación de contraseña',
  })
  async forgotPassword(
    @Args('input') input: EmailInput,
  ): Promise<MessageResponseType> {
    return this.authService.forgotPassword(input.email);
  }

  @Mutation(() => MessageResponseType, {
    description: 'Restablecer contraseña con token',
  })
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<MessageResponseType> {
    return this.authService.resetPassword(input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponseType, {
    description: 'Cambiar la contraseña del usuario autenticado',
  })
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<MessageResponseType> {
    const userId = context.req?.user?.userId ?? '';
    return this.authService.changePassword({
      userId,
      oldPassword: input.oldPassword,
      newPassword: input.newPassword,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponseType, {
    description: 'Cerrar sesion del usuario autenticado',
  })
  async logout(
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<MessageResponseType> {
    const userId = context.req?.user?.userId ?? '';
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponseType, {
    description: 'Solicitar codigo para eliminar la cuenta autenticada',
  })
  async requestAccountDeletion(
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<MessageResponseType> {
    const userId = context.req?.user?.userId ?? '';
    return this.authService.requestAccountDeletion(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponseType, {
    description: 'Confirmar eliminacion definitiva de la cuenta autenticada',
  })
  async confirmAccountDeletion(
    @Args('input') input: ConfirmAccountDeletionInput,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<MessageResponseType> {
    const userId = context.req?.user?.userId ?? '';
    return this.authService.confirmAccountDeletion(userId, input.code);
  }
}
