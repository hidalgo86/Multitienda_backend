import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType({ description: 'Categoría de productos' })
export class CategoryType {
  @Field(() => ID, { description: 'ID de la categoría' })
  id!: string;

  @Field({ description: 'Nombre de la categoría' })
  name!: string;

  @Field({ description: 'Slug amigable para URL' })
  slug!: string;

  @Field(() => ID, {
    nullable: true,
    description: 'Categoría padre (jerarquía)',
  })
  parentId?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}
