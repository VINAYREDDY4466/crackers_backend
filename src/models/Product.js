import mongoose from 'mongoose';
import { AGE_GROUPS, STOCK_STATUSES } from '../constants/catalog.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    ageGroup: { type: String, enum: AGE_GROUPS, required: true },
    unit: { type: String, trim: true, maxlength: 40, default: '' },
    imageUrl: { type: String, default: '' },
    imageKey: { type: String, default: '' },
    originalPrice: { type: Number, required: true, min: 1, max: 100000 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 90 },
    finalPrice: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    stockStatus: { type: String, enum: STOCK_STATUSES, default: 'in_stock' },
    stockQuantity: { type: Number, min: 0, max: 100000, default: null },
  },
  { timestamps: true },
);

productSchema.pre('validate', function setFinalPrice(next) {
  const discount = Number(this.discountPercentage) || 0;
  const original = Number(this.originalPrice) || 0;
  this.finalPrice = Math.max(0, Math.round(original * (1 - discount / 100)));
  next();
});

productSchema.index({ categoryId: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ ageGroup: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
