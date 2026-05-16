import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { UserRole } from '@/modules/users/schemas/users.schema';
import { AuditService } from './audit.service';
import { GetAuditLogsInput } from './dto/inputs/get-audit-logs.input';
import { PaginatedAuditLogType } from './dto/types/paginated-audit-log.type';
import { AuditLogModel } from './model/audit-log.model';

@Resolver(() => AuditLogModel)
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Query(() => PaginatedAuditLogType, {
    description: 'Lista registros de auditoria para administracion',
  })
  async auditLogs(
    @Args('input', { type: () => GetAuditLogsInput, nullable: true })
    input?: GetAuditLogsInput,
  ): Promise<PaginatedAuditLogType> {
    return this.auditService.findAuditLogs(input);
  }
}
