// Importa los decoradores y utilidades de NestJS necesarios para crear un guard
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
// Importa la clave que se usa para almacenar los roles requeridos en los endpoints
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard de roles para NestJS
 * Este guard verifica si el usuario tiene el rol necesario para acceder a un endpoint protegido.
 * Se utiliza junto con el decorador @Roles() en los controladores o métodos.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  // El reflector permite acceder a los metadatos de los decoradores
  constructor(private reflector: Reflector) {}

  /**
   * Método principal que determina si el usuario puede acceder al recurso
   * @param context - Contexto de ejecución de la petición
   * @returns boolean - true si el usuario tiene acceso, false si no
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtiene los roles requeridos definidos con el decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se especifican roles en el endpoint, permite el acceso a cualquiera
    if (!requiredRoles) {
      return true;
    }

    // Obtiene el usuario autenticado desde HTTP o GraphQL
    // HTTP
    const httpReq = context.switchToHttp().getRequest<Request>();
    // GraphQL
    const gqlCtx = GqlExecutionContext.create(context);
    const gqlCtxRaw = gqlCtx?.getContext?.<unknown>();
    const gqlReq =
      gqlCtxRaw && typeof gqlCtxRaw === 'object' && 'req' in gqlCtxRaw
        ? (gqlCtxRaw as { req?: Request }).req
        : undefined;
    const httpUser = httpReq?.user as { role?: string } | undefined;
    const gqlUser = gqlReq?.user as { role?: string } | undefined;
    const user = httpUser ?? gqlUser;

    // Verifica si el rol del usuario está incluido en los roles permitidos
    // Si el usuario tiene el rol requerido, retorna true y permite el acceso
    // Si no, retorna false y bloquea el acceso
    if (!user?.role) return false;
    return requiredRoles.includes(user.role);
  }
}

/**
 * Resumen:
 * - Se usa junto con el decorador @Roles('admin'), @Roles('cliente'), etc.
 * - Si el endpoint no tiene roles definidos, cualquier usuario autenticado puede acceder.
 * - Si tiene roles, solo los usuarios con ese rol pueden acceder.
 * - El rol del usuario debe estar en user.role (normalmente lo pone el JWT).
 * - Si el usuario no tiene el rol, la petición será rechazada automáticamente por NestJS.
 */
