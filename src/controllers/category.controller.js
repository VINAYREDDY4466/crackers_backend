import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  createCategory,
  deleteCategory,
  listCategories,
  replaceCategoryImage,
  updateCategory,
} from '../services/category.service.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  res.json({ success: true, categories });
});

export const getAdminCategories = asyncHandler(async (_req, res) => {
  const categories = await listCategories({ includeInactive: true });
  res.json({ success: true, categories });
});

export const postCategory = asyncHandler(async (req, res) => {
  const category = await createCategory(req.body);
  res.status(201).json({ success: true, category });
});

export const putCategory = asyncHandler(async (req, res) => {
  const category = await updateCategory(req.params.id, req.body);
  res.json({ success: true, category });
});

export const removeCategory = asyncHandler(async (req, res) => {
  await deleteCategory(req.params.id);
  res.json({ success: true, message: 'Category deleted.' });
});

export const uploadCategoryImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image to upload.', 400);
  const category = await replaceCategoryImage(req.params.id, req.file.buffer);
  res.json({ success: true, category });
});
