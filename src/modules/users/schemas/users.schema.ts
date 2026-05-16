// src/modules/users/schemas/users.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { exposeIdAndOmitFields } from '../../../common/mongoose/transforms';

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
  if (typeof this.username === 'string') {
    this.username = this.username.trim();
    this.usernameNormalized = this.username.toLowerCase();
  }

  next();
});

const transformUser = exposeIdAndOmitFields([
  'password',
  'usernameNormalized',
  'verificationCodeHash',
  'verificationCodeExpiresAt',
  'refreshTokenHash',
  'passwordResetTokenHash',
  'passwordResetTokenExpiresAt',
  'accountDeletionCodeHash',
  'accountDeletionCodeExpiresAt',
  'lastAccountDeletionSentAt',
  'failedLoginAttempts',
  'lastFailedLoginAt',
]);

UserSchema.set('toObject', {
  transform: transformUser,
});

UserSchema.set('toJSON', {
  transform: transformUser,
});
