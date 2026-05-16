import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { BannerModel } from './models/banner.model';

@Injectable()
export class BannersRepository {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<BannerDocument>,
  ) {}

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private idValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toHexString();
    }

    return '';
  }

  private dateValue(value: unknown): Date | undefined {
    return value instanceof Date ? value : undefined;
  }

  private normalizeBanner(raw: Record<string, unknown>): BannerModel {
    const rawId = this.idValue(raw.id) || this.idValue(raw._id);

    return {
      id: rawId,
      title: this.stringValue(raw.title),
      imageUrl: this.stringValue(raw.imageUrl),
      imagePublicId:
        typeof raw.imagePublicId === 'string' ? raw.imagePublicId : null,
      altText: this.stringValue(raw.altText),
      subtitle: this.stringValue(raw.subtitle),
      linkUrl: typeof raw.linkUrl === 'string' ? raw.linkUrl : null,
      ctaLabel: this.stringValue(raw.ctaLabel),
      order: Number(raw.order ?? 0),
      isActive: Boolean(raw.isActive),
      startsAt: raw.startsAt instanceof Date ? raw.startsAt : null,
      endsAt: raw.endsAt instanceof Date ? raw.endsAt : null,
      createdAt: this.dateValue(raw.createdAt),
      updatedAt: this.dateValue(raw.updatedAt),
    };
  }

  async create(data: Partial<BannerModel>): Promise<BannerModel> {
    const created = (
      await new this.bannerModel(data).save()
    ).toObject() as unknown as Record<string, unknown>;
    return this.normalizeBanner(created);
  }

  async findById(id: string): Promise<BannerModel | null> {
    const banner = await this.bannerModel.findById(id).exec();
    if (!banner) return null;
    return this.normalizeBanner(
      banner.toObject() as unknown as Record<string, unknown>,
    );
  }

  async findAll(): Promise<BannerModel[]> {
    const banners = await this.bannerModel
      .find()
      .sort({ order: 1, createdAt: -1 })
      .exec();

    return banners.map((banner) =>
      this.normalizeBanner(
        banner.toObject() as unknown as Record<string, unknown>,
      ),
    );
  }

  async findActive(): Promise<BannerModel[]> {
    const now = new Date();
    const banners = await this.bannerModel
      .find({
        isActive: true,
        $and: [
          {
            $or: [
              { startsAt: null },
              { startsAt: { $exists: false } },
              { startsAt: { $lte: now } },
            ],
          },
          {
            $or: [
              { endsAt: null },
              { endsAt: { $exists: false } },
              { endsAt: { $gte: now } },
            ],
          },
        ],
      })
      .sort({ order: 1, createdAt: -1 })
      .exec();

    return banners.map((banner) =>
      this.normalizeBanner(
        banner.toObject() as unknown as Record<string, unknown>,
      ),
    );
  }

  async update(
    id: string,
    data: Partial<BannerModel>,
  ): Promise<BannerModel | null> {
    const updated = await this.bannerModel
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();

    if (!updated) return null;

    return this.normalizeBanner(
      updated.toObject() as unknown as Record<string, unknown>,
    );
  }

  async delete(id: string): Promise<BannerModel | null> {
    const deleted = await this.bannerModel.findByIdAndDelete(id).exec();
    if (!deleted) return null;

    return this.normalizeBanner(
      deleted.toObject() as unknown as Record<string, unknown>,
    );
  }
}
