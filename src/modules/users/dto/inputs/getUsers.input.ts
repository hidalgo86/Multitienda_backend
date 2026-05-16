import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { UserRole, UserStatus } from '../../schemas/users.schema';

@InputType()
export class UsersFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  email?: string;

  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @Field(() => UserStatus, { nullable: true })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

@InputType()
export class UsersPaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page!: number;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;
}

@InputType()
export class UsersQueryInput {
  @Field(() => UsersFilterInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => UsersFilterInput)
  filters?: UsersFilterInput;

  @Field(() => UsersPaginationInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => UsersPaginationInput)
  pagination?: UsersPaginationInput;
}
