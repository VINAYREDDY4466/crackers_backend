import { Banner } from '../models/Banner.js';
import { AppError } from '../utils/AppError.js';
import { deleteStoredImage, uploadBuffer } from './upload.service.js';

const TEXT_FIELDS = ['title', 'subtitle', 'buttonLabel', 'linkUrl'];

export function presentBanner(banner) {
  return {
    id: banner._id,
    title: banner.title,
    subtitle: banner.subtitle,
    buttonLabel: banner.buttonLabel,
    linkUrl: banner.linkUrl,
    imageUrl: banner.imageUrl,
    isActive: banner.isActive,
    displayOrder: banner.displayOrder,
    updatedAt: banner.updatedAt,
  };
}

export async function listBanners({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true, imageUrl: { $ne: '' } };
  const banners = await Banner.find(filter).sort({ displayOrder: 1, createdAt: -1 }).limit(includeInactive ? 50 : 8);
  return banners.map(presentBanner);
}

function assignBanner(banner, input) {
  for (const field of TEXT_FIELDS) {
    if (input[field] !== undefined) banner[field] = String(input[field]).trim();
  }
  if (input.isActive !== undefined) banner.isActive = input.isActive === true || input.isActive === 'true';
  if (input.displayOrder !== undefined) banner.displayOrder = Number(input.displayOrder) || 0;

  const nextUrl = input.imageUrl?.trim();
  if (nextUrl && nextUrl !== banner.imageUrl) {
    const previousKey = banner.imageKey;
    banner.imageUrl = nextUrl;
    banner.imageKey = '';
    return previousKey;
  }
  return '';
}

export async function createBanner(input) {
  const banner = new Banner();
  assignBanner(banner, input);
  await banner.save();
  return presentBanner(banner);
}

export async function updateBanner(id, input) {
  const banner = await Banner.findById(id);
  if (!banner) throw new AppError('Banner not found.', 404);
  const replacedKey = assignBanner(banner, input);
  await banner.save();
  await deleteStoredImage(replacedKey);
  return presentBanner(banner);
}

export async function deleteBanner(id) {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) throw new AppError('Banner not found.', 404);
  await deleteStoredImage(banner.imageKey);
}

export async function replaceBannerImage(id, buffer) {
  const banner = await Banner.findById(id);
  if (!banner) throw new AppError('Banner not found.', 404);
  const uploaded = await uploadBuffer({ buffer, folder: 'banners' });
  const previousKey = banner.imageKey;
  banner.imageUrl = uploaded.imageUrl;
  banner.imageKey = uploaded.imageKey;
  await banner.save();
  await deleteStoredImage(previousKey);
  return presentBanner(banner);
}
