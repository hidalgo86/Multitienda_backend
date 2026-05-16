import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 180;

const getAuditLogRetentionSeconds = (): number => {
  const configuredDays = Number(process.env.AUDIT_LOG_RETENTION_DAYS);
  const retentionDays =
    Number.isFinite(configuredDays) && configuredDays > 0
      ? configuredDays
      : DEFAULT_AUDIT_LOG_RETENTION_DAYS;

  return Math.trunc(retentionDays * 24 * 60 * 60);
};

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop({ index: true })
  requestId?: string;

  @Prop({ index: true })
  actorUserId?: string;

  @Prop()
  actorRole?: string;

  @Prop()
  actorLabel?: string;

  @Prop({ required: true, index: true })
  action!: string;

  @Prop({ required: true, index: true })
  entityType!: string;

  @Prop({ index: true })
  entityId?: string;

  @Prop()
  entityLabel?: string;

  @Prop()
  ip?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, unknown>;

  createdAt?: Date;

  updatedAt?: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLog>;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.set('toObject', {
  transform: (_: unknown, ret: Record<string, unknown>) => {
    if (ret && typeof ret === 'object' && '_id' in ret) {
      const id = (ret as { _id?: unknown })._id;
      (ret as { id?: string }).id = typeof id === 'string' ? id : String(id);
      delete (ret as { _id?: unknown })._id;
    }
    delete (ret as { __v?: unknown }).__v;
    return ret;
  },
});

AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: getAuditLogRetentionSeconds() },
);
AuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
