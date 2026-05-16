// src/modules/users/schemas/users.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum UserStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
  ELIMINADO = 'eliminado',
}

export enum UserRole {
  CLIENTE = 'cliente',
  ADMINISTRADOR = 'administrador',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  usernameNormalized!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  role!: UserRole;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: String, default: null })
  verificationCodeHash?: string | null;

  @Prop({ type: Date, default: null })
  verificationCodeExpiresAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastVerificationSentAt?: Date;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: String, default: null })
  passwordResetTokenHash?: string | null;

  @Prop({ type: Date, default: null })
  passwordResetTokenExpiresAt?: Date | null;

  @Prop({ type: String, default: null })
  accountDeletionCodeHash?: string | null;

  @Prop({ type: Date, default: null })
  accountDeletionCodeExpiresAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastAccountDeletionSentAt?: Date | null;

  @Prop({ type: Number, default: 0, min: 0 })
  failedLoginAttempts!: number;

  @Prop({ type: Date, default: null })
  lastFailedLoginAt?: Date | null;

  @Prop({
    enum: UserStatus,
    default: UserStatus.ACTIVO,
  })
  status!: UserStatus;

  @Prop({ type: String, default: null })
  name?: string;

  @Prop({ type: String, default: null })
  address?: string;

  @Prop({ type: String, default: null })
  phone?: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('validate', function (next) {
  const doc = this as UserDocument & {
    username?: string;
    usernameNormalized?: string;
  };

  if (typeof doc.username === 'string') {
    doc.username = doc.username.trim();
    doc.usernameNormalized = doc.username.toLowerCase();
  }

  next();
});

UserSchema.set('toObject', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    if (ret && typeof ret === 'object' && '_id' in ret) {
      const id = (ret as { _id?: unknown })._id;
      (ret as { id?: string }).id = typeof id === 'string' ? id : String(id);
      delete (ret as { _id?: unknown })._id;
    }
    delete (ret as { __v?: unknown }).__v;
    delete (ret as { password?: unknown }).password;
    delete (ret as { usernameNormalized?: unknown }).usernameNormalized;
    delete (ret as { verificationCodeHash?: unknown }).verificationCodeHash;
    delete (ret as { verificationCodeExpiresAt?: unknown })
      .verificationCodeExpiresAt;
    delete (ret as { refreshTokenHash?: unknown }).refreshTokenHash;
    delete (ret as { passwordResetTokenHash?: unknown }).passwordResetTokenHash;
    delete (ret as { passwordResetTokenExpiresAt?: unknown })
      .passwordResetTokenExpiresAt;
    delete (ret as { accountDeletionCodeHash?: unknown })
      .accountDeletionCodeHash;
    delete (ret as { accountDeletionCodeExpiresAt?: unknown })
      .accountDeletionCodeExpiresAt;
    delete (ret as { lastAccountDeletionSentAt?: unknown })
      .lastAccountDeletionSentAt;
    delete (ret as { failedLoginAttempts?: unknown }).failedLoginAttempts;
    delete (ret as { lastFailedLoginAt?: unknown }).lastFailedLoginAt;
    return ret;
  },
});

UserSchema.set('toJSON', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    if (ret && typeof ret === 'object' && '_id' in ret) {
      const id = (ret as { _id?: unknown })._id;
      (ret as { id?: string }).id = typeof id === 'string' ? id : String(id);
      delete (ret as { _id?: unknown })._id;
    }
    delete (ret as { __v?: unknown }).__v;
    delete (ret as { password?: unknown }).password;
    delete (ret as { usernameNormalized?: unknown }).usernameNormalized;
    delete (ret as { verificationCodeHash?: unknown }).verificationCodeHash;
    delete (ret as { verificationCodeExpiresAt?: unknown })
      .verificationCodeExpiresAt;
    delete (ret as { refreshTokenHash?: unknown }).refreshTokenHash;
    delete (ret as { passwordResetTokenHash?: unknown }).passwordResetTokenHash;
    delete (ret as { passwordResetTokenExpiresAt?: unknown })
      .passwordResetTokenExpiresAt;
    delete (ret as { accountDeletionCodeHash?: unknown })
      .accountDeletionCodeHash;
    delete (ret as { accountDeletionCodeExpiresAt?: unknown })
      .accountDeletionCodeExpiresAt;
    delete (ret as { lastAccountDeletionSentAt?: unknown })
      .lastAccountDeletionSentAt;
    delete (ret as { failedLoginAttempts?: unknown }).failedLoginAttempts;
    delete (ret as { lastFailedLoginAt?: unknown }).lastFailedLoginAt;
    return ret;
  },
});
