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

  @Field({ nullable: true, description: 'Descripcion publica' })
  description?: string;

  @Field({ nullable: true, description: 'Imagen publica de la categoria' })
  imageUrl?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Public ID de Cloudinary',
  })
  imagePublicId?: string | null;

  @Field({ description: 'Indica si aparece destacada en la tienda' })
  isFeatured!: boolean;

  @Field({ description: 'Orden visual en listados destacados' })
  displayOrder!: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;
}
