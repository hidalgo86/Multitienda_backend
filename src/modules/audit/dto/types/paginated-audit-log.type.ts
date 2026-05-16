import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AuditLogModel } from '@/modules/audit/model/audit-log.model';

@ObjectType()
export class PaginatedAuditLogType {
  @Field(() => [AuditLogModel])
  items!: AuditLogModel[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  totalPages!: number;
}
