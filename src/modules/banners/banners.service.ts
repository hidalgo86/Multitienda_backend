import { Injectable, NotFoundException } from '@nestjs/common';
import { handleServiceError } from '@/common/exceptions/error-handler.util';
import { BannersRepository } from './banners.repository';
import { BannerModel } from './models/banner.model';

@Injectable()
export class BannersService {
  constructor(private readonly bannersRepository: BannersRepository) {}

  async create(input: {
    title: string;
    imageUrl: string;
    imagePublicId?: string | null;
    altText?: string | null;
    subtitle?: string | null;
    linkUrl?: string | null;
    ctaLabel?: string | null;
    order?: number;
    isActive?: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
  }): Promise<BannerModel> {
    try {
      return await this.bannersRepository.create({
        title: input.title.trim(),
        imageUrl: input.imageUrl.trim(),
        imagePublicId: input.imagePublicId?.trim() || null,
        altText: input.altText?.trim() || input.title.trim(),
        subtitle: input.subtitle?.trim() || '',
        linkUrl: input.linkUrl?.trim() || null,
        ctaLabel: input.ctaLabel?.trim() || '',
        order: input.order ?? 0,
        isActive: input.isActive ?? true,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
      });
    } catch (error: unknown) {
      handleServiceError(error, 'Error creating banner');
      throw error;
    }
  }

  async findById(id: string): Promise<BannerModel> {
    const banner = await this.bannersRepository.findById(id);
    if (!banner) {
      throw new NotFoundException(`Banner con ID ${id} no encontrado`);
    }
    return banner;
  }

  async findAll(): Promise<BannerModel[]> {
    return this.bannersRepository.findAll();
  }

  async findActive(): Promise<BannerModel[]> {
    return this.bannersRepository.findActive();
  }

  async update(
    id: string,
    input: {
      title?: string;
      imageUrl?: string;
      imagePublicId?: string | null;
      altText?: string | null;
      subtitle?: string | null;
      linkUrl?: string | null;
      ctaLabel?: string | null;
      order?: number;
      isActive?: boolean;
      startsAt?: Date | null;
      endsAt?: Date | null;
    },
  ): Promise<BannerModel> {
    try {
      const existing = await this.findById(id);
      const updated = await this.bannersRepository.update(id, {
        title: input.title?.trim() || existing.title,
        imageUrl: input.imageUrl?.trim() || existing.imageUrl,
        imagePublicId:
          input.imagePublicId !== undefined
            ? input.imagePublicId?.trim() || null
            : (existing.imagePublicId ?? null),
        altText:
          input.altText !== undefined
            ? (input.altText ?? '').trim() ||
              input.title?.trim() ||
              existing.title
            : existing.altText,
        subtitle:
          input.subtitle !== undefined
            ? (input.subtitle ?? '').trim()
            : existing.subtitle,
        linkUrl:
          input.linkUrl !== undefined
            ? (input.linkUrl ?? '').trim() || null
            : (existing.linkUrl ?? null),
        ctaLabel:
          input.ctaLabel !== undefined
            ? (input.ctaLabel ?? '').trim()
            : existing.ctaLabel,
        order: input.order ?? existing.order,
        isActive: input.isActive ?? existing.isActive,
        startsAt:
          input.startsAt !== undefined
            ? input.startsAt
            : (existing.startsAt ?? null),
        endsAt:
          input.endsAt !== undefined ? input.endsAt : (existing.endsAt ?? null),
      });

      if (!updated) {
        throw new NotFoundException('No se pudo actualizar el banner');
      }

      return updated;
    } catch (error: unknown) {
      handleServiceError(error, 'Error updating banner');
      throw error;
    }
  }

  async delete(id: string): Promise<BannerModel> {
    try {
      await this.findById(id);
      const deleted = await this.bannersRepository.delete(id);
      if (!deleted) {
        throw new NotFoundException('No se pudo eliminar el banner');
      }
      return deleted;
    } catch (error: unknown) {
      handleServiceError(error, 'Error deleting banner');
      throw error;
    }
  }
}
