import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetAuditLogsInput } from './dto/inputs/get-audit-logs.input';
import { PaginatedAuditLogType } from './dto/types/paginated-audit-log.type';
import { AuditLogModel } from './model/audit-log.model';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { AuditAction, AuditEntityType } from './audit-events';
import { anonymizeIp } from '@/common/utils/ip-anonymization.util';
import { UsersService } from '@/modules/users/users.service';

export interface AuditRecord {
  requestId?: string;
  actorUserId?: string;
  actorRole?: string;
  actorLabel?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly usersService: UsersService,
  ) {}

  private async getUserLabel(userId?: string): Promise<string | undefined> {
    if (!userId) return undefined;

    const user = await this.usersService.getUserById(userId).catch(() => null);
    return user?.username || user?.email || undefined;
  }

  private async buildUserLabelMap(
    userIds: Array<string | undefined>,
  ): Promise<Map<string, string>> {
    const uniqueIds = Array.from(
      new Set(userIds.filter((userId): userId is string => Boolean(userId))),
    );
    const entries = await Promise.all(
      uniqueIds.map(async (userId) => {
        const label = await this.getUserLabel(userId);
        return label ? ([userId, label] as const) : null;
      }),
    );

    return new Map(
      entries.filter((entry): entry is [string, string] => !!entry),
    );
  }

  private getAuthEntityLabel(
    action: string,
    actorLabel?: string,
    metadata?: Record<string, unknown>,
  ): string | undefined {
    if (action === String(AuditAction.Logout) && actorLabel) {
      return `Sesion de ${actorLabel}`;
    }

    if (action === String(AuditAction.LoginFailed)) {
      const username = metadata?.username;
      return typeof username === 'string' && username.trim()
        ? `Intento de ${username.trim()}`
        : 'Intento de inicio de sesion';
    }

    if (action === String(AuditAction.LoginSuccess) && actorLabel) {
      return actorLabel;
    }

    return undefined;
  }

  private resolveEntityLabel(
    record: Pick<
      AuditRecord,
      'action' | 'entityType' | 'entityId' | 'entityLabel' | 'metadata'
    >,
    actorLabel?: string,
    userLabels?: Map<string, string>,
  ): string | undefined {
    if (record.entityLabel) {
      return record.entityLabel;
    }

    if (record.entityType === String(AuditEntityType.Auth)) {
      return this.getAuthEntityLabel(
        record.action,
        actorLabel,
        record.metadata,
      );
    }

    if (record.entityType === String(AuditEntityType.User) && record.entityId) {
      return userLabels?.get(record.entityId);
    }

    return undefined;
  }

  async record(record: AuditRecord): Promise<void> {
    try {
      const [actorLabel, userEntityLabel] = await Promise.all([
        record.actorLabel ?? this.getUserLabel(record.actorUserId),
        record.entityType === String(AuditEntityType.User)
          ? this.getUserLabel(record.entityId)
          : undefined,
      ]);
      const userLabels = new Map<string, string>();
      if (record.entityId && userEntityLabel) {
        userLabels.set(record.entityId, userEntityLabel);
      }
      const entityLabel = this.resolveEntityLabel(
        record,
        actorLabel,
        userLabels,
      );

      await this.auditLogModel.create({
        ...record,
        actorLabel,
        entityLabel,
        ip: anonymizeIp(record.ip),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al guardar auditoria: ${message}`);
      throw error;
    }
  }

  async findAuditLogs(
    input?: GetAuditLogsInput,
  ): Promise<PaginatedAuditLogType> {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 20;
    const query: Record<string, string> = {};

    if (input?.actorUserId) query.actorUserId = input.actorUserId;
    if (input?.action) query.action = input.action;
    if (input?.entityType) query.entityType = input.entityType;
    if (input?.entityId) query.entityId = input.entityId;

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(query).exec(),
    ]);

    const userLabels = await this.buildUserLabelMap([
      ...items.map((item) => item.actorUserId),
      ...items
        .filter((item) => item.entityType === 'User')
        .map((item) => item.entityId),
    ]);

    const auditLogs: AuditLogModel[] = items.map((item) => {
      const actorLabel =
        item.actorLabel ||
        (item.actorUserId ? userLabels.get(item.actorUserId) : undefined);

      return {
        id: String(item._id),
        requestId: item.requestId,
        actorUserId: item.actorUserId,
        actorRole: item.actorRole,
        actorLabel,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        entityLabel: this.resolveEntityLabel(item, actorLabel, userLabels),
        ip: anonymizeIp(item.ip),
        metadata: item.metadata,
        createdAt: item.createdAt ?? new Date(0),
      };
    });

    return {
      items: auditLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
