export class CategoryModel {
  id!: string;
  name!: string;
  slug!: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string | null;
  isFeatured?: boolean;
  displayOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
