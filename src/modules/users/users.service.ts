import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';

import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { buildPagination } from '@/common/utils/pagination.util';
import { PaginatedModel } from '@/common/models/paginated.model';

import { AuthUserModel } from './model/auth-user.model';
import { UserModel } from './model/user.model';
import { CreateUserModel } from './model/createUser.model';
import { UpdateProfileModel } from './model/updateProfile.model';
import { UsersQueryModel } from './model/userQuery.model';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from './schemas/users.schema';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private normalizeEmail(email: string): string {
    return String(email).trim().toLowerCase();
  }

  private normalizeUsername(username: string): string {
    return String(username).trim();
  }

  private normalizeUsernameKey(username: string): string {
    return this.normalizeUsername(username).toLowerCase();
  }

  private buildQuery(filters: UsersQueryModel['filters']): Record<string, any> {
    const query: Record<string, any> = {};

    if (filters.username) {
      query.username = { $regex: filters.username, $options: 'i' };
    }

    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }

    if (filters.role !== undefined) {
      query.role = filters.role;
    }

    if (filters.isEmailVerified !== undefined) {
      query.isEmailVerified = filters.isEmailVerified;
    }

    if (filters.status !== undefined) {
      query.status = filters.status;
    }

    return query;
  }

  private toModel(user: UserDocument): UserModel {
    return user.toObject() as unknown as UserModel;
  }

  private toAuthModel(user: UserDocument): AuthUserModel {
    const timestamps = user as UserDocument & {
      createdAt?: Date;
      updatedAt?: Date;
    };

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      verificationCodeHash: user.verificationCodeHash ?? null,
      verificationCodeExpiresAt: user.verificationCodeExpiresAt ?? null,
      lastVerificationSentAt: user.lastVerificationSentAt ?? null,
      refreshTokenHash: user.refreshTokenHash ?? null,
      passwordResetTokenHash: user.passwordResetTokenHash ?? null,
      passwordResetTokenExpiresAt: user.passwordResetTokenExpiresAt ?? null,
      accountDeletionCodeHash: user.accountDeletionCodeHash ?? null,
      accountDeletionCodeExpiresAt: user.accountDeletionCodeExpiresAt ?? null,
      lastAccountDeletionSentAt: user.lastAccountDeletionSentAt ?? null,
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      lastFailedLoginAt: user.lastFailedLoginAt ?? null,
      status: user.status,
      name: user.name ?? null,
      address: user.address ?? null,
      phone: user.phone ?? null,
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
    };
  }

  async createUser(input: CreateUserModel): Promise<UserModel> {
    try {
      const user = await this.usersRepository.createUser({
        ...input,
        email: this.normalizeEmail(input.email),
        username: this.normalizeUsername(input.username),
        usernameNormalized: this.normalizeUsernameKey(input.username),
      });
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error al crear usuario');
    }
  }

  async getUserById(userId: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuario por id');
    }
  }

  async getUserByEmail(userEmail: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.findByEmail(
        this.normalizeEmail(userEmail),
      );
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuario por email');
    }
  }

  async getUserByUsername(username: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.findByUsername(
        this.normalizeUsernameKey(username),
      );
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuario por username');
    }
  }

  async getAuthUserById(userId: string): Promise<AuthUserModel> {
    try {
      const user = await this.usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return this.toAuthModel(user);
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuario auth por id');
    }
  }

  async getAuthUserByEmail(email: string): Promise<AuthUserModel> {
    try {
      const user = await this.usersRepository.findByEmail(
        this.normalizeEmail(email),
      );
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return this.toAuthModel(user);
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuario auth por email');
    }
  }

  async getAuthUserByUsername(username: string): Promise<AuthUserModel> {
    try {
      const user = await this.usersRepository.findByUsername(
        this.normalizeUsernameKey(username),
      );
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return this.toAuthModel(user);
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuario auth por username');
    }
  }

  async findUsers(input?: UsersQueryModel): Promise<PaginatedModel<UserModel>> {
    try {
      const { filters, pagination } = new UsersQueryModel(input);
      const query = this.buildQuery(filters);
      const { page, limit, skip } = buildPagination(pagination);

      const { items, total } = await this.usersRepository.findWithFilters(
        query,
        skip,
        limit,
      );

      return new PaginatedModel<UserModel>({
        items: items.map((user) => this.toModel(user)),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuarios');
    }
  }

  async findAllDeleted(
    pagination?: UsersQueryModel['pagination'],
  ): Promise<PaginatedModel<UserModel>> {
    try {
      const { page, limit, skip } = buildPagination(pagination);

      const { items, total } = await this.usersRepository.findAllDeleted(
        skip,
        limit,
      );

      return new PaginatedModel<UserModel>({
        items: items.map((user) => this.toModel(user)),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      handleServiceError(error, 'Error al buscar usuarios eliminados');
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserModel> {
    try {
      const user = await this.usersRepository.updateField(userId, { role });
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar rol del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al actualizar rol');
    }
  }

  async updateUserStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UserModel> {
    try {
      const update: Partial<User> = { status };

      if (status === UserStatus.ACTIVO) {
        update.failedLoginAttempts = 0;
        update.lastFailedLoginAt = null;
      }

      const user = await this.usersRepository.updateField(userId, update);
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar status del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al actualizar status');
    }
  }

  async updateUserProfile(input: UpdateProfileModel): Promise<UserModel> {
    try {
      const { id, ...rest } = input;
      const user = await this.usersRepository.updateField(id, rest);
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar perfil del usuario con id ${id}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al actualizar perfil');
    }
  }

  async updateUserPassword(
    userId: string,
    newPassword: string,
  ): Promise<UserModel> {
    try {
      const user = await this.usersRepository.updateField(userId, {
        password: newPassword,
      });
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar contraseña del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al actualizar contraseña');
    }
  }

  async resetPasswordCredentials(
    userId: string,
    newPassword: string,
  ): Promise<UserModel> {
    try {
      const user = await this.usersRepository.updateField(userId, {
        password: newPassword,
        refreshTokenHash: null,
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      });
      if (!user) {
        throw new BadRequestException(
          `Error al restablecer credenciales del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al restablecer credenciales');
    }
  }

  async markEmailAsVerified(userId: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.updateField(userId, {
        isEmailVerified: true,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
      });
      if (!user) {
        throw new BadRequestException(
          `Error al marcar como verificado el usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al marcar email verificado');
    }
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<UserModel> {
    try {
      const user = await this.usersRepository.updateField(userId, {
        refreshTokenHash,
      });
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar refresh token del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al actualizar refresh token');
    }
  }

  async recordFailedLoginAttempt(
    userId: string,
    shouldSuspend: boolean,
    failedAt = new Date(),
  ): Promise<AuthUserModel> {
    try {
      const user = await this.usersRepository.incrementFailedLoginAttempts(
        userId,
        shouldSuspend,
        failedAt,
      );
      if (!user) {
        throw new BadRequestException(
          `Error al registrar intento fallido del usuario con id ${userId}`,
        );
      }
      return this.toAuthModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al registrar intento fallido');
    }
  }

  async resetFailedLoginAttempts(userId: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.resetFailedLoginAttempts(userId);
      if (!user) {
        throw new BadRequestException(
          `Error al reiniciar intentos fallidos del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al reiniciar intentos fallidos');
    }
  }

  async updateAuthVerificationState(
    userId: string,
    verificationCodeHash: string,
    lastVerificationSentAt: Date,
    verificationCodeExpiresAt: Date,
  ): Promise<UserModel> {
    try {
      const user = await this.usersRepository.updateField(userId, {
        verificationCodeHash,
        lastVerificationSentAt,
        verificationCodeExpiresAt,
      });
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar el estado de verificación del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(
        error,
        'Error interno al actualizar estado de verificación',
      );
    }
  }

  async softDeleteUser(userId: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.softDeleteUser(userId);
      if (!user) {
        throw new BadRequestException(
          `Error al eliminar (soft) el usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al eliminar (soft) usuario');
    }
  }

  async updatePasswordResetState(
    userId: string,
    passwordResetTokenHash: string | null,
    passwordResetTokenExpiresAt: Date | null,
  ): Promise<UserModel> {
    try {
      const user = await this.usersRepository.updateField(userId, {
        passwordResetTokenHash,
        passwordResetTokenExpiresAt,
      });
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar reset token del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al actualizar reset token');
    }
  }

  async updateAccountDeletionState(
    userId: string,
    accountDeletionCodeHash: string | null,
    accountDeletionCodeExpiresAt: Date | null,
    lastAccountDeletionSentAt?: Date | null,
  ): Promise<UserModel> {
    try {
      const update: Partial<User> = {
        accountDeletionCodeHash,
        accountDeletionCodeExpiresAt,
      };

      if (lastAccountDeletionSentAt !== undefined) {
        update.lastAccountDeletionSentAt = lastAccountDeletionSentAt;
      }

      const user = await this.usersRepository.updateField(userId, update);
      if (!user) {
        throw new BadRequestException(
          `Error al actualizar estado de eliminacion del usuario con id ${userId}`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(
        error,
        'Error interno al actualizar estado de eliminacion',
      );
    }
  }

  async deleteUser(userId: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.deleteUser(userId);
      if (!user) {
        throw new BadRequestException(`Usuario con id ${userId} no encontrado`);
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al eliminar usuario');
    }
  }

  async restoreUser(userId: string): Promise<UserModel> {
    try {
      const user = await this.usersRepository.restoreStatus(userId);
      if (!user) {
        throw new BadRequestException(
          `No se puede restaurar el usuario con id ${userId}. Verifique que está eliminado.`,
        );
      }
      return this.toModel(user);
    } catch (error) {
      handleServiceError(error, 'Error interno al restaurar usuario');
    }
  }
}
