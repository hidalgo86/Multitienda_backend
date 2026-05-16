import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/users.schema';
import { CategoriesService } from './categories.service';
import { CreateCategoryInput } from './dto/inputs/createCategory.input';
import { UpdateCategoryInput } from './dto/inputs/updateCategory.input';
import { CategoryType } from './dto/types/category.type';

@Resolver()
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => CategoryType, { description: 'Crear una nueva categoria' })
  async createCategory(
    @Args('input') input: CreateCategoryInput,
  ): Promise<CategoryType> {
    const category = await this.categoriesService.create(input);
    return category as CategoryType;
  }

  @Query(() => CategoryType, {
    nullable: true,
    description: 'Obtener categoria por ID',
  })
  async category(@Args('id') id: string): Promise<CategoryType | null> {
    try {
      const category = await this.categoriesService.findById(id);
      return category as CategoryType;
    } catch {
      return null;
    }
  }

  @Query(() => CategoryType, {
    nullable: true,
    description: 'Obtener categoria por slug',
  })
  async categoryBySlug(
    @Args('slug') slug: string,
  ): Promise<CategoryType | null> {
    try {
      const category = await this.categoriesService.findBySlug(slug);
      return category as CategoryType;
    } catch {
      return null;
    }
  }

  @Query(() => [CategoryType], { description: 'Listar todas las categorias' })
  async categories(): Promise<CategoryType[]> {
    const categories = await this.categoriesService.findAll();
    return categories as CategoryType[];
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => CategoryType, { description: 'Actualizar una categoria' })
  async updateCategory(
    @Args('id') id: string,
    @Args('input') input: UpdateCategoryInput,
  ): Promise<CategoryType> {
    const category = await this.categoriesService.update(id, input);
    return category as CategoryType;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Mutation(() => CategoryType, { description: 'Eliminar una categoria' })
  async deleteCategory(@Args('id') id: string): Promise<CategoryType> {
    const category = await this.categoriesService.delete(id);
    return category as CategoryType;
  }
}
