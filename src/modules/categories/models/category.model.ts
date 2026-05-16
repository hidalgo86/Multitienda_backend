export class CategoryModel {
  id!: string;
  name!: string;
  slug!: string;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
