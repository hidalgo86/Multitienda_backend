import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import type { GraphQLResolveInfo } from 'graphql';
import { Observable, tap } from 'rxjs';
import { AuditService } from '@/modules/audit/audit.service';
import { anonymizeIp } from '@/common/utils/ip-anonymization.util';
import { AuditAction, AuditEntityType } from '@/modules/audit/audit-events';
import { ProductsRepository } from '@/modules/products/products.repository';

interface TraceUser {
  userId?: string;
  role?: string;
}

type TraceRequest = Request & {
  requestId?: string;
  user?: TraceUser;
};

interface AuditEventDefinition {
  action: AuditAction;
  entityType: AuditEntityType;
}

const AUDITABLE_MUTATIONS: Record<string, AuditEventDefinition> = {
  login: { action: AuditAction.LoginSuccess, entityType: AuditEntityType.Auth },
  logout: { action: AuditAction.Logout, entityType: AuditEntityType.Auth },
  register: {
    action: AuditAction.UserCreated,
    entityType: AuditEntityType.User,
  },
  updateUserRole: {
    action: AuditAction.UserRoleChanged,
    entityType: AuditEntityType.User,
  },
  updateUserStatus: {
    action: AuditAction.UserStatusChanged,
    entityType: AuditEntityType.User,
  },
  changePassword: {
    action: AuditAction.PasswordChanged,
    entityType: AuditEntityType.User,
  },
  checkoutMyCart: {
    action: AuditAction.OrderCreated,
    entityType: AuditEntityType.Order,
  },
  payMyOrder: {
    action: AuditAction.OrderPaid,
    entityType: AuditEntityType.Order,
  },
  adminPayOrder: {
    action: AuditAction.OrderPaid,
    entityType: AuditEntityType.Order,
  },
  adminUnpayOrder: {
    action: AuditAction.OrderPaymentReverted,
    entityType: AuditEntityType.Order,
  },
  cancelMyOrder: {
    action: AuditAction.OrderCancelled,
    entityType: AuditEntityType.Order,
  },
  adminCancelOrder: {
    action: AuditAction.OrderCancelled,
    entityType: AuditEntityType.Order,
  },
  createProduct: {
    action: AuditAction.ProductCreated,
    entityType: AuditEntityType.Product,
  },
};

function getClientIp(req?: TraceRequest): string | undefined {
  const forwardedFor = req?.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim();
  }

  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0];
  }

  return req?.ip || req?.socket?.remoteAddress;
}

function getEntityId(args: Record<string, unknown>, result: unknown) {
  if (result && typeof result === 'object' && 'id' in result) {
    const id = (result as { id?: unknown }).id;
    return typeof id === 'string' ? id : undefined;
  }

  if (result && typeof result === 'object' && 'user' in result) {
    const user = (result as { user?: unknown }).user;
    if (user && typeof user === 'object' && 'id' in user) {
      const id = (user as { id?: unknown }).id;
      return typeof id === 'string' ? id : undefined;
    }
  }

  for (const key of ['id', 'userId', 'orderId', 'productId']) {
    const value = args[key];
    if (typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

function getStringProperty(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const property = value[key];
  return typeof property === 'string' && property.trim()
    ? property.trim()
    : undefined;
}

function getEntityLabel(result: unknown): string | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  const record = result as Record<string, unknown>;
  const nestedUser = record.user;

  if (nestedUser && typeof nestedUser === 'object') {
    const userRecord = nestedUser as Record<string, unknown>;
    return (
      getStringProperty(userRecord, 'username') ||
      getStringProperty(userRecord, 'email')
    );
  }

  return (
    getStringProperty(record, 'username') ||
    getStringProperty(record, 'email') ||
    getStringProperty(record, 'name') ||
    getStringProperty(record, 'sku')
  );
}

function getInput(args: Record<string, unknown>): Record<string, unknown> {
  const input = args.input;
  return input && typeof input === 'object' && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
}

function getUpdateProductActions(
  args: Record<string, unknown>,
): AuditEventDefinition[] {
  const input = getInput(args);
  const events: AuditEventDefinition[] = [];

  if (Object.keys(input).length > 0) {
    events.push({
      action: AuditAction.ProductUpdated,
      entityType: AuditEntityType.Product,
    });
  }

  if ('price' in input || 'variants' in input) {
    events.push({
      action: AuditAction.ProductPriceChanged,
      entityType: AuditEntityType.Product,
    });
  }

  if ('stock' in input || 'variants' in input) {
    events.push({
      action: AuditAction.ProductStockChanged,
      entityType: AuditEntityType.Product,
    });
  }

  return events;
}

function getAuditEventDefinitions(
  fieldName: string,
  args: Record<string, unknown>,
): AuditEventDefinition[] {
  if (fieldName === 'updateProduct') {
    return getUpdateProductActions(args);
  }

  const event = AUDITABLE_MUTATIONS[fieldName];
  return event ? [event] : [];
}

function summarizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return { count: value.length };
  }

  if (value && typeof value === 'object') {
    return { changed: true };
  }

  return value;
}

function getRecordValue(value: unknown, field: string): unknown {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)[field]
    : undefined;
}

function getChangeSummary(
  input: Record<string, unknown>,
  before?: unknown,
  after?: unknown,
) {
  return Object.fromEntries(
    Object.keys(input).map((key) => {
      const beforeValue = getRecordValue(before, key);
      const afterValue = getRecordValue(after, key) ?? input[key];

      return [
        key,
        {
          before: summarizeAuditValue(beforeValue),
          after: summarizeAuditValue(afterValue),
        },
      ];
    }),
  );
}

function getAuditMetadata(
  fieldName: string,
  args: Record<string, unknown>,
  durationMs: number,
  before?: unknown,
  after?: unknown,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { durationMs };
  const input = getInput(args);

  if (fieldName.startsWith('update') && Object.keys(input).length > 0) {
    metadata.changedFields = Object.keys(input);
    metadata.changes = getChangeSummary(input, before, after);
  }

  return metadata;
}

function resolveActorUserId(user: TraceUser | undefined, result: unknown) {
  return user?.userId ?? getEntityId({}, result);
}

@Injectable()
export class GraphqlTracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GraphqlTracingInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly productsRepository: ProductsRepository,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() !== 'graphql') {
      return next.handle();
    }

    const startedAt = Date.now();
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo<GraphQLResolveInfo>();
    const operationType = info.operation.operation;
    const fieldName = info.fieldName;
    const args = gqlContext.getArgs<Record<string, unknown>>();
    const request = gqlContext.getContext<{ req?: TraceRequest }>().req;
    const requestId = request?.requestId;
    const user = request?.user;
    const ip = anonymizeIp(getClientIp(request));
    const previousProductPromise =
      fieldName === 'updateProduct' && typeof args.id === 'string'
        ? this.productsRepository.findById(args.id).catch(() => null)
        : Promise.resolve(null);

    return next.handle().pipe(
      tap({
        next: (result) => {
          const durationMs = Date.now() - startedAt;
          const actor = user?.userId ?? 'anonymous';

          this.logger.log(
            JSON.stringify({
              event: 'graphql_request',
              requestId,
              operationType,
              fieldName,
              actor,
              role: user?.role,
              ip,
              durationMs,
              status: 'success',
            }),
          );

          const auditEvents =
            String(operationType) === 'mutation'
              ? getAuditEventDefinitions(fieldName, args)
              : [];

          for (const auditEvent of auditEvents) {
            void previousProductPromise
              .then((previousProduct) =>
                this.auditService.record({
                  requestId,
                  actorUserId: resolveActorUserId(user, result),
                  actorRole: user?.role,
                  action: auditEvent.action,
                  entityType: auditEvent.entityType,
                  entityId: getEntityId(args, result),
                  entityLabel: getEntityLabel(result),
                  ip,
                  metadata: getAuditMetadata(
                    fieldName,
                    args,
                    durationMs,
                    previousProduct ?? undefined,
                    result,
                  ),
                }),
              )
              .catch((error: unknown) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                this.logger.error(
                  `No se pudo registrar auditoria ${fieldName}: ${message}`,
                );
              });
          }
        },
        error: (error: unknown) => {
          const durationMs = Date.now() - startedAt;
          const message =
            error instanceof Error ? error.message : String(error);

          this.logger.warn(
            JSON.stringify({
              event: 'graphql_request',
              requestId,
              operationType,
              fieldName,
              actor: user?.userId ?? 'anonymous',
              role: user?.role,
              ip,
              durationMs,
              status: 'error',
              error: message,
            }),
          );

          if (String(operationType) === 'mutation' && fieldName === 'login') {
            const input = getInput(args);

            void this.auditService
              .record({
                requestId,
                action: AuditAction.LoginFailed,
                entityType: AuditEntityType.Auth,
                ip,
                metadata: {
                  durationMs,
                  username:
                    typeof input.username === 'string'
                      ? input.username
                      : undefined,
                },
              })
              .catch((auditError: unknown) => {
                const auditMessage =
                  auditError instanceof Error
                    ? auditError.message
                    : String(auditError);
                this.logger.error(
                  `No se pudo registrar auditoria login_failed: ${auditMessage}`,
                );
              });
          }
        },
      }),
    );
  }
}
