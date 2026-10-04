import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { clampNumber, escapeRegex } from '../utils/http.js';
import { uniqueSlug } from '../utils/slugify.js';
import { AGE_GROUPS } from '../constants/catalog.js';
import { deleteStoredImage, uploadBuffer } from './upload.service.js';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { finalPrice: 1 },
  price_desc: { finalPrice: -1 },
  discount: { discountPercentage: -1, createdAt: -1 },
};

export function presentProduct(product) {
  const category = product.categoryId && product.categoryId.name
    ? {
      id: product.categoryId._id,
      name: product.categoryId.name,
      slug: product.categoryId.slug,
    }
    : null;

  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    ageGroup: product.ageGroup,
    unit: product.unit || '',
    imageUrl: product.imageUrl,
    originalPrice: product.originalPrice,
    discountPercentage: product.discountPercentage,
    finalPrice: product.finalPrice,
    isActive: product.isActive,
    stockStatus: product.stockStatus,
    stockQuantity: product.stockQuantity,
    category,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function resolveCategory(categoryId) {
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError('Choose a valid category.', 422);
  return category;
}

export async function listProducts(query, { includeInactive = false } = {}) {
  const page = clampNumber(query.page, 1, 500, 1);
  const limit = clampNumber(query.limit, 1, 48, 12);
  const filter = {};

  if (!includeInactive) filter.isActive = true;

  if (query.categoryId) {
    if (!mongoose.isValidObjectId(String(query.categoryId))) {
      return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.categoryId = query.categoryId;
  } else if (query.category) {
    const category = await Category.findOne({
      slug: String(query.category).slice(0, 80),
      ...(includeInactive ? {} : { isActive: true }),
    });
    if (!category) {
      return { items: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }
    filter.categoryId = category._id;
  }

  if (AGE_GROUPS.includes(query.ageGroup)) filter.ageGroup = query.ageGroup;
  if (query.offers === 'true') filter.discountPercentage = { $gt: 0 };
  if (includeInactive && query.active === 'true') filter.isActive = true;
  if (includeInactive && query.active === 'false') filter.isActive = false;

  if (query.search) {
    const term = escapeRegex(String(query.search).trim().slice(0, 60));
    if (term) {
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }
  }

  const sort = SORTS[query.sort] || SORTS.newest;
  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .populate('categoryId', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items: products.map(presentProduct),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProductBySlug(slug, { includeInactive = false } = {}) {
  const filter = { slug: String(slug).slice(0, 90) };
  if (!includeInactive) filter.isActive = true;
  const product = await Product.findOne(filter).populate('categoryId', 'name slug isActive');
  if (!product || (!includeInactive && product.categoryId && product.categoryId.isActive === false)) {
    throw new AppError('Product not found.', 404);
  }
  return presentProduct(product);
}

export async function getProductById(id) {
  const product = await Product.findById(id).populate('categoryId', 'name slug');
  if (!product) throw new AppError('Product not found.', 404);
  return presentProduct(product);
}

function assignProduct(product, input) {
  product.name = input.name.trim();
  product.description = input.description.trim();
  product.categoryId = input.categoryId;
  product.ageGroup = input.ageGroup;
  product.unit = input.unit?.trim() || '';
  product.originalPrice = Number(input.originalPrice);
  product.discountPercentage = Number(input.discountPercentage || 0);
  product.stockStatus = input.stockStatus || 'in_stock';
  product.isActive = input.isActive !== false && input.isActive !== 'false';
  if (input.stockQuantity === '' || input.stockQuantity === null || input.stockQuantity === undefined) {
    product.stockQuantity = null;
  } else {
    product.stockQuantity = Number(input.stockQuantity);
  }
}

export async function createProduct(input) {
  await resolveCategory(input.categoryId);
  const product = new Product();
  assignProduct(product, input);
  product.slug = await uniqueSlug(Product, input.name);
  await product.save();
  return getProductById(product._id);
}

export async function updateProduct(id, input) {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);
  await resolveCategory(input.categoryId);
  assignProduct(product, input);
  await product.save();
  return getProductById(product._id);
}

export async function updateAvailability(id, input) {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);
  if (input.isActive !== undefined) product.isActive = Boolean(input.isActive);
  if (input.stockStatus) product.stockStatus = input.stockStatus;
  await product.save();
  return getProductById(product._id);
}

export async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError('Product not found.', 404);
  await deleteStoredImage(product.imageKey);
}

export async function replaceProductImage(id, buffer) {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);
  const uploaded = await uploadBuffer({ buffer, folder: 'products' });
  const previousKey = product.imageKey;
  product.imageUrl = uploaded.imageUrl;
  product.imageKey = uploaded.imageKey;
  await product.save();
  await deleteStoredImage(previousKey);
  return getProductById(product._id);
}
