import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLScalarType, Kind } from 'graphql';

const GraphQLJSONObject = new GraphQLScalarType({
  name: 'JSONObject',
  description: 'Objeto JSON',
  serialize: (value: unknown) => value,
  parseValue: (value: unknown) => value,
  parseLiteral: (ast): unknown => {
    if (ast.kind !== Kind.OBJECT) return null;

    return ast.fields.reduce<Record<string, unknown>>((acc, field) => {
      switch (field.value.kind) {
        case Kind.STRING:
        case Kind.BOOLEAN:
          acc[field.name.value] = field.value.value;
          break; 
        case Kind.INT:
        case Kind.FLOAT:
          acc[field.name.value] = Number(field.value.value);
          break;
        case Kind.LIST:
          acc[field.name.value] = [];
          break;
        case Kind.OBJECT:
          acc[field.name.value] = {};
          break;
        default:
          acc[field.name.value] = null;
      }
      return acc;
    }, {});
  },
});

@ObjectType()
export class AuditLogModel {
  @Field()
  id!: string;

  @Field({ nullable: true })
  requestId?: string;

  @Field({ nullable: true })
  actorUserId?: string;

  @Field({ nullable: true })
  actorRole?: string;

  @Field({ nullable: true })
  actorLabel?: string;

  @Field()
  action!: string;

  @Field()
  entityType!: string;

  @Field({ nullable: true })
  entityId?: string;

  @Field({ nullable: true })
  entityLabel?: string;

  @Field({ nullable: true })
  ip?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: Record<string, unknown>;

  @Field()
  createdAt!: Date;
}
