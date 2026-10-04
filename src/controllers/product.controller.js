import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  listProducts,
  replaceProductImage,
  updateAvailability,
  updateProduct,
} from '../services/product.service.js';

export const getProducts = asyncHandler(async (req, res) => {
  const result = await listProducts(req.query);
  res.json({ success: true, ...result });
});

export const getProductsByCategory = asyncHandler(async (req, res) => {
  const result = await listProducts({ ...req.query, categoryId: req.params.categoryId });
  res.json({ success: true, ...result });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.slug);
  res.json({ success: true, product });
});

export const getAdminProducts = asyncHandler(async (req, res) => {
  const result = await listProducts(req.query, { includeInactive: true });
  res.json({ success: true, ...result });
});

export const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await getProductById(req.params.id);
  res.json({ success: true, product });
});

export const postProduct = asyncHandler(async (req, res) => {
  const product = await createProduct(req.body);
  res.status(201).json({ success: true, product });
});

export const putProduct = asyncHandler(async (req, res) => {
  const product = await updateProduct(req.params.id, req.body);
  res.json({ success: true, product });
});

export const patchAvailability = asyncHandler(async (req, res) => {
  const product = await updateAvailability(req.params.id, req.body);
  res.json({ success: true, product });
});

export const removeProduct = asyncHandler(async (req, res) => {
  await deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted.' });
});

export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image to upload.', 400);
  const product = await replaceProductImage(req.params.id, req.file.buffer);
  res.json({ success: true, product });
});
