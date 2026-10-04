import mongoose from 'mongoose';
import { AGE_GROUPS } from '../constants/catalog.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    imageUrl: { type: String, default: '' },
    imageKey: { type: String, default: '' },
    ageGroup: { type: String, enum: [...AGE_GROUPS, 'all'], default: 'all' },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categorySchema.index({ displayOrder: 1 });

export const Category = mongoose.model('Category', categorySchema);
