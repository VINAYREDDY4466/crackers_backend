import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 90, default: '' },
    subtitle: { type: String, trim: true, maxlength: 180, default: '' },
    buttonLabel: { type: String, trim: true, maxlength: 30, default: '' },
    linkUrl: { type: String, trim: true, maxlength: 300, default: '' },
    imageUrl: { type: String, default: '' },
    imageKey: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0, min: 0, max: 999 },
  },
  { timestamps: true },
);

bannerSchema.index({ isActive: 1, displayOrder: 1 });

export const Banner = mongoose.model('Banner', bannerSchema);
