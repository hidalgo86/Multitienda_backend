export interface BannerModel {
  id: string;
  title: string;
  imageUrl: string;
  imagePublicId?: string | null;
  altText: string;
  subtitle: string;
  linkUrl?: string | null;
  ctaLabel: string;
  order: number;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
