import mongoose from 'mongoose';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../constants/catalog.js';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1, max: 50 },
    originalPrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false },
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '', maxlength: 300 },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    clientRequestId: { type: String, unique: true, sparse: true },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      phone: { type: String, required: true, trim: true, maxlength: 15 },
      address: { type: String, required: true, trim: true, maxlength: 300 },
      notes: { type: String, default: '', trim: true, maxlength: 300 },
    },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'whatsapp_redirected' },
    whatsappRedirected: { type: Boolean, default: false },
    whatsappRedirectedAt: { type: Date },
    whatsappMessage: { type: String, default: '' },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
