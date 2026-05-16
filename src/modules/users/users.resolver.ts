// src/modules/users/users.resolver.ts
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, UserStatus } from './schemas/users.schema';
import { UsersQueryInput } from './dto/inputs/getUsers.input';
import { PaginatedUserType } from './dto/types/paginatedUser.type';
import { UpdateProfileInput } from './dto/inputs/updateProfile.input';
import { UserType } from './dto/types/user.types';
import { UsersQueryModel } from './model/userQuery.model';
import { UsersService } from './users.service';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  private getUserIdFromContext(context: {
    req?: Request & { user?: { userId?: string } };
  }): string {
    const userId = context.req?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return userId;
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserType, {
    description: 'Obtener el perfil del usuario autenticado',
  })
  async me(
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<UserType> {
    return this.usersService.getUserById(this.getUserIdFromContext(context));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Query(() => PaginatedUserType, {
    description: 'Lista usuarios para administracion',
  })
  async adminUsers(
    @Args('input', { type: () => UsersQueryInput, nullable: true })
    input?: UsersQueryInput,
  ): Promise<PaginatedUserType> {
    const queryModel = new UsersQueryModel({
      filters: input?.filters ?? {},
      pagination: input?.pagination,
    });

    return this.usersService.findUsers(queryModel);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserType, {
    description: 'Actualizar el perfil del usuario autenticado',
  })
  async updateMyProfile(
    @Args('input') input: UpdateProfileInput,
    @Context() context: { req?: Request & { user?: { userId?: string } } },
  ): Promise<UserType> {
    return this.usersService.updateUserProfile({
      id: this.getUserIdFromContext(context),
      ...input,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => UserType, {
    description: 'Actualiza el estado de un usuario desde administracion',
  })
  async updateUserStatus(
    @Args('userId') userId: string,
    @Args('status', { type: () => UserStatus }) status: UserStatus,
  ): Promise<UserType> {
    return this.usersService.updateUserStatus(userId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => UserType, {
    description: 'Actualiza el rol de un usuario desde administracion',
  })
  async updateUserRole(
    @Args('userId') userId: string,
    @Args('role', { type: () => UserRole }) role: UserRole,
  ): Promise<UserType> {
    return this.usersService.updateUserRole(userId, role);
  }
}
