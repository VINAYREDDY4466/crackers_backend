import { env } from '../config/env.js';
import { Settings } from '../models/Settings.js';

const PUBLIC_FIELDS = [
  'shopName',
  'tagline',
  'marqueeEnabled',
  'marqueeItems',
  'whatsappGreeting',
  'isOrderingOpen',
  'contactPhone',
  'email',
  'address',
  'about',
  'safetyNote',
  'whatsappNumber',
];

const EDITABLE_FIELDS = PUBLIC_FIELDS;

export async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      whatsappNumber: env.whatsappNumber,
      contactPhone: env.whatsappNumber,
      about: 'Deepam Crackers is a seasonal Diwali shop. Browse the catalog, choose what you need, and send the order on WhatsApp. There is no account to create.',
    });
  }
  return settings;
}

export function presentPublicSettings(settings) {
  return PUBLIC_FIELDS.reduce((payload, field) => {
    payload[field] = settings[field];
    return payload;
  }, {});
}

function normalize(field, value) {
  if (field === 'whatsappNumber') return String(value).replace(/\D/g, '');
  if (field === 'marqueeItems') {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 10);
  }
  return value;
}

export async function updateSettings(input) {
  const settings = await getSettings();

  for (const field of EDITABLE_FIELDS) {
    if (input[field] !== undefined) {
      settings[field] = normalize(field, input[field]);
    }
  }

  await settings.save();
  return settings;
}

export async function resolveWhatsappNumber() {
  const settings = await getSettings();
  return settings.whatsappNumber || env.whatsappNumber;
}
