import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { uniqueSlug } from '../utils/slugify.js';
import { deleteStoredImage, uploadBuffer } from './upload.service.js';

function presentCategory(category, productCount = 0) {
  return {
    id: category._id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    ageGroup: category.ageGroup,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
    productCount,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

async function productCounts(categoryIds) {
  const rows = await Product.aggregate([
    { $match: { categoryId: { $in: categoryIds }, isActive: true } },
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

export async function listCategories({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ displayOrder: 1, name: 1 });
  const counts = await productCounts(categories.map((category) => category._id));
  return categories.map((category) => presentCategory(category, counts.get(String(category._id)) || 0));
}

export async function createCategory(input) {
  const category = await Category.create({
    name: input.name.trim(),
    slug: await uniqueSlug(Category, input.name),
    description: input.description?.trim() || '',
    ageGroup: input.ageGroup || 'all',
    isActive: input.isActive !== false,
    displayOrder: Number(input.displayOrder) || 0,
  });
  return presentCategory(category, 0);
}

export async function updateCategory(id, input) {
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found.', 404);

  if (input.name) category.name = input.name.trim();
  if (input.description !== undefined) category.description = input.description.trim();
  if (input.ageGroup) category.ageGroup = input.ageGroup;
  if (input.isActive !== undefined) category.isActive = input.isActive === true || input.isActive === 'true';
  if (input.displayOrder !== undefined) category.displayOrder = Number(input.displayOrder) || 0;

  await category.save();
  const counts = await productCounts([category._id]);
  return presentCategory(category, counts.get(String(category._id)) || 0);
}

export async function deleteCategory(id) {
  const inUse = await Product.exists({ categoryId: id });
  if (inUse) {
    throw new AppError('Move or delete the products in this category before deleting it.', 409);
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new AppError('Category not found.', 404);
  await deleteStoredImage(category.imageKey);
}

export async function replaceCategoryImage(id, buffer) {
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found.', 404);

  const uploaded = await uploadBuffer({ buffer, folder: 'categories' });
  const previousKey = category.imageKey;
  category.imageUrl = uploaded.imageUrl;
  category.imageKey = uploaded.imageKey;
  await category.save();
  await deleteStoredImage(previousKey);
  return presentCategory(category);
}
