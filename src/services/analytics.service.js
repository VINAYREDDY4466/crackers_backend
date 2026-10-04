import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { Product } from '../models/Product.js';
import { EVENT_TYPES } from '../constants/catalog.js';

function browserName(userAgent) {
  const ua = userAgent || '';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

function deviceType(userAgent, hinted) {
  if (['mobile', 'tablet', 'desktop'].includes(hinted)) return hinted;
  const ua = userAgent || '';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}

export function clientContext(req, hints = {}) {
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 180);
  const referrer = String(hints.referrer || req.headers.referer || '').slice(0, 200);
  return {
    deviceType: deviceType(userAgent, hints.deviceType),
    browser: browserName(userAgent),
    userAgent,
    referrer,
  };
}

export async function recordEvent({ eventType, productId = null, orderId = null, sessionId = '', metadata = {} }) {
  if (!EVENT_TYPES.includes(eventType)) return null;
  return AnalyticsEvent.create({
    eventType,
    productId,
    orderId,
    sessionId: String(sessionId || '').slice(0, 64),
    metadata,
  });
}

export async function trackPublicEvent(input, req) {
  if (input.productId) {
    const exists = await Product.exists({ _id: input.productId });
    if (!exists) return null;
  }

  const context = clientContext(req, input);
  const metadata = {
    deviceType: context.deviceType,
    browser: context.browser,
    referrer: context.referrer,
  };

  if (input.eventType === 'add_to_cart') {
    metadata.quantity = Number(input.quantity) || 1;
  }
  if (input.eventType === 'whatsapp_contact') {
    metadata.page = String(input.page || '').slice(0, 120);
  }

  return recordEvent({
    eventType: input.eventType,
    productId: input.productId || null,
    sessionId: input.sessionId,
    metadata,
  });
}
