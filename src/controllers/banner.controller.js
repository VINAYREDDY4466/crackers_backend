import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  createBanner,
  deleteBanner,
  listBanners,
  replaceBannerImage,
  updateBanner,
} from '../services/banner.service.js';

export const getAdminBanners = asyncHandler(async (_req, res) => {
  const banners = await listBanners({ includeInactive: true });
  res.json({ success: true, banners });
});

export const postBanner = asyncHandler(async (req, res) => {
  const banner = await createBanner(req.body);
  res.status(201).json({ success: true, banner });
});

export const putBanner = asyncHandler(async (req, res) => {
  const banner = await updateBanner(req.params.id, req.body);
  res.json({ success: true, banner });
});

export const removeBanner = asyncHandler(async (req, res) => {
  await deleteBanner(req.params.id);
  res.json({ success: true, message: 'Banner deleted.' });
});

export const uploadBannerImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image to upload.', 400);
  const banner = await replaceBannerImage(req.params.id, req.file.buffer);
  res.json({ success: true, banner });
});
