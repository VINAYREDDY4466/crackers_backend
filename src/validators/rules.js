import { body, param, query } from 'express-validator';
import { AGE_GROUPS, EVENT_TYPES, ORDER_STATUSES, PAYMENT_STATUSES, STOCK_STATUSES } from '../constants/catalog.js';

export const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 80 }).withMessage('Enter your password.'),
];

export const categoryRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Category name should be 2 to 80 characters.'),
  body('description').optional().isString().isLength({ max: 400 }).withMessage('Description is too long.'),
  body('ageGroup').optional().isIn([...AGE_GROUPS, 'all']).withMessage('Choose a valid age group.'),
  body('isActive').optional().isBoolean().withMessage('Active must be true or false.'),
  body('displayOrder').optional().isInt({ min: 0, max: 999 }).withMessage('Display order must be between 0 and 999.'),
];

export const productRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Product name should be 2 to 120 characters.'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Add a description of at least 10 characters.'),
  body('categoryId').isMongoId().withMessage('Choose a category.'),
  body('ageGroup').isIn(AGE_GROUPS).withMessage('Choose kids, family, or adults.'),
  body('originalPrice').isFloat({ min: 1, max: 100000 }).withMessage('Enter a price between 1 and 100000.'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 90 }).withMessage('Discount must be between 0 and 90.'),
  body('stockStatus').optional().isIn(STOCK_STATUSES).withMessage('Choose a valid stock status.'),
  body('stockQuantity').optional({ nullable: true }).custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 && number <= 100000;
  }).withMessage('Stock quantity must be a whole number.'),
  body('isActive').optional().isBoolean().withMessage('Active must be true or false.'),
  body('unit').optional().isString().isLength({ max: 40 }).withMessage('Pack details must be 40 characters or less.'),
];

function isSafeLink(value) {
  if (!value) return true;
  if (/^\/(?!\/)\S*$/.test(value)) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export const bannerRules = [
  body('title').optional().isString().isLength({ max: 90 }).withMessage('Title must be 90 characters or less.'),
  body('subtitle').optional().isString().isLength({ max: 180 }).withMessage('Subtitle must be 180 characters or less.'),
  body('buttonLabel').optional().isString().isLength({ max: 30 }).withMessage('Button label must be 30 characters or less.'),
  body('linkUrl').optional().isString().custom(isSafeLink)
    .withMessage('Use a shop path like /offers or a full https:// link.'),
  body('imageUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Image link must start with https://.'),
  body('isActive').optional().isBoolean().withMessage('Active must be true or false.'),
  body('displayOrder').optional().isInt({ min: 0, max: 999 }).withMessage('Display order must be between 0 and 999.'),
];

export const availabilityRules = [
  body('isActive').optional().isBoolean().withMessage('Active must be true or false.'),
  body('stockStatus').optional().isIn(STOCK_STATUSES).withMessage('Choose a valid stock status.'),
];

export const orderRules = [
  body('clientRequestId').optional().isUUID().withMessage('Invalid order request.'),
  body('sessionId').optional().isString().isLength({ max: 64 }),
  body('deviceType').optional().isIn(['mobile', 'tablet', 'desktop']),
  body('referrer').optional().isString().isLength({ max: 200 }),
  body('customer.name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter the customer name.'),
  body('customer.phone').trim().custom((value) => /^[6-9]\d{9}$/.test(String(value).replace(/\D/g, '').slice(-10)))
    .withMessage('Enter a valid 10-digit mobile number.'),
  body('customer.address').trim().isLength({ min: 8, max: 300 }).withMessage('Enter the delivery address.'),
  body('customer.notes').optional().isString().isLength({ max: 300 }).withMessage('Notes are too long.'),
  body('items').isArray({ min: 1, max: 30 }).withMessage('Add at least one product.'),
  body('items.*.productId').isMongoId().withMessage('A product in the cart is invalid.'),
  body('items.*.quantity').isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50.'),
];

export const analyticsRules = [
  body('eventType').isIn(['product_view', 'add_to_cart', 'whatsapp_contact']).withMessage('This event cannot be recorded here.'),
  body('page').optional().isString().isLength({ max: 120 }),
  body('productId').optional().isMongoId().withMessage('Invalid product.'),
  body('sessionId').optional().isString().isLength({ max: 64 }),
  body('quantity').optional().isInt({ min: 1, max: 50 }),
  body('deviceType').optional().isIn(['mobile', 'tablet', 'desktop']),
  body('referrer').optional().isString().isLength({ max: 200 }),
];

export const statusRules = [
  param('id').isMongoId().withMessage('Invalid order.'),
  body('orderStatus').isIn(ORDER_STATUSES).withMessage('Choose a valid order status.'),
  body('note').optional().isString().isLength({ max: 300 }),
];

export const paymentRules = [
  param('id').isMongoId().withMessage('Invalid order.'),
  body('paymentStatus').isIn(PAYMENT_STATUSES).withMessage('Choose a valid payment status.'),
  body('note').optional().isString().isLength({ max: 300 }),
];

export const settingsRules = [
  body('shopName').optional().trim().isLength({ min: 2, max: 80 }),
  body('tagline').optional().isString().isLength({ max: 180 }),
  body('marqueeEnabled').optional().isBoolean(),
  body('marqueeItems').optional().isArray({ max: 10 }).withMessage('Use at most 10 scrolling messages.'),
  body('marqueeItems.*').isString().isLength({ max: 160 }).withMessage('Each scrolling message must be 160 characters or less.'),
  body('whatsappGreeting').optional().isString().isLength({ max: 300 }).withMessage('WhatsApp message is too long.'),
  body('isOrderingOpen').optional().isBoolean(),
  body('whatsappNumber').optional().custom((value) => !value || /^[1-9]\d{10,14}$/.test(String(value).replace(/\D/g, '')))
    .withMessage('Enter the WhatsApp number with country code, for example 919876543210.'),
  body('contactPhone').optional().isString().isLength({ max: 20 }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid contact email.'),
  body('address').optional().isString().isLength({ max: 300 }),
  body('about').optional().isString().isLength({ max: 2000 }),
  body('safetyNote').optional().isString().isLength({ max: 400 }),
];

export const idParam = [param('id').isMongoId().withMessage('Invalid id.')];

export const listQuery = [
  query('page').optional().isInt({ min: 1, max: 500 }),
  query('limit').optional().isInt({ min: 1, max: 48 }),
];

export { EVENT_TYPES };
