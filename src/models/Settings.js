import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, default: 'Deepam Crackers', trim: true, maxlength: 80 },
    tagline: {
      type: String,
      default: 'Choose your favourite crackers and place your order directly through WhatsApp.',
      maxlength: 180,
    },
    marqueeEnabled: { type: Boolean, default: true },
    marqueeItems: {
      type: [{ type: String, trim: true, maxlength: 160 }],
      default: [],
      validate: [(items) => items.length <= 10, 'Use at most 10 scrolling messages.'],
    },
    whatsappGreeting: {
      type: String,
      default: 'Hello, I would like to know more about your Diwali crackers.',
      maxlength: 300,
    },
    isOrderingOpen: { type: Boolean, default: true },
    whatsappNumber: { type: String, default: '', maxlength: 15 },
    contactPhone: { type: String, default: '', maxlength: 20 },
    email: { type: String, default: '', maxlength: 120 },
    address: { type: String, default: '', maxlength: 300 },
    about: { type: String, default: '', maxlength: 2000 },
    safetyNote: {
      type: String,
      default: 'Light crackers in an open space, follow local rules, and keep children supervised by an adult.',
      maxlength: 400,
    },
  },
  { timestamps: true },
);

export const Settings = mongoose.model('Settings', settingsSchema);
