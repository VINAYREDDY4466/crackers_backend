import mongoose from 'mongoose';
import { EVENT_TYPES } from '../constants/catalog.js';

const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    sessionId: { type: String, default: '', maxlength: 64 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ productId: 1, eventType: 1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
