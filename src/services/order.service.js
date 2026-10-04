import { Counter } from '../models/Counter.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { clampNumber, escapeRegex } from '../utils/http.js';
import { buildWhatsappMessage, buildWhatsappUrl } from '../utils/whatsapp.js';
import { clientContext, recordEvent } from './analytics.service.js';
import { getSettings, resolveWhatsappNumber } from './settings.service.js';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '../constants/catalog.js';

async function nextOrderNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'order' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return `ORD-${1000 + counter.seq}`;
}

function presentOrder(order, whatsappUrl) {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    customer: order.customer,
    items: order.items,
    totalAmount: order.totalAmount,
    totalDiscount: order.totalDiscount,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    whatsappRedirected: order.whatsappRedirected,
    whatsappRedirectedAt: order.whatsappRedirectedAt,
    whatsappMessage: order.whatsappMessage,
    whatsappUrl: whatsappUrl || '',
    timeline: order.timeline,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function reserveStock(product, quantity) {
  if (product.stockQuantity == null) return { tracked: false };

  const updated = await Product.findOneAndUpdate(
    { _id: product._id, stockQuantity: { $gte: quantity } },
    { $inc: { stockQuantity: -quantity } },
    { new: true },
  );

  if (!updated) {
    throw new AppError(`${product.name} does not have enough stock.`, 409);
  }

  if (updated.stockQuantity === 0 && updated.stockStatus !== 'out_of_stock') {
    updated.stockStatus = 'out_of_stock';
    await updated.save();
  }

  return { tracked: true, productId: product._id, quantity };
}

async function restoreStock(reservations) {
  await Promise.all(reservations.filter((item) => item.tracked).map((item) => (
    Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity } })
  )));
}

export async function createOrder(input, req) {
  const requestId = String(input.clientRequestId || '');
  if (requestId) {
    const existing = await Order.findOne({ clientRequestId: requestId });
    if (existing) {
      const number = await resolveWhatsappNumber();
      return presentOrder(existing, buildWhatsappUrl(number, existing.whatsappMessage));
    }
  }

  const settings = await getSettings();
  if (!settings.isOrderingOpen) {
    throw new AppError('Ordering is closed right now. Please check back soon.', 403);
  }

  const whatsappNumber = settings.whatsappNumber || (await resolveWhatsappNumber());
  if (!whatsappNumber) {
    throw new AppError('WhatsApp ordering is not configured yet.', 503);
  }

  const requested = Array.isArray(input.items) ? input.items : [];
  if (!requested.length || requested.length > 30) {
    throw new AppError('Add between 1 and 30 products to the order.', 422);
  }

  const ids = [...new Set(requested.map((item) => String(item.productId)))];
  const products = await Product.find({ _id: { $in: ids }, isActive: true }).populate('categoryId', 'isActive');
  const byId = new Map(products.map((product) => [String(product._id), product]));

  const items = [];
  for (const requestedItem of requested) {
    const product = byId.get(String(requestedItem.productId));
    const quantity = clampNumber(requestedItem.quantity, 1, 50, 0);
    if (!product || !quantity || product.stockStatus === 'out_of_stock' || product.categoryId?.isActive === false) {
      throw new AppError('One of the products is unavailable. Refresh the cart and try again.', 409);
    }
    const subtotal = product.finalPrice * quantity;
    items.push({
      productId: product._id,
      productName: product.name,
      imageUrl: product.imageUrl,
      quantity,
      originalPrice: product.originalPrice,
      discountPercentage: product.discountPercentage,
      finalPrice: product.finalPrice,
      subtotal,
      product,
    });
  }

  const reservations = [];
  try {
    for (const item of items) {
      reservations.push(await reserveStock(item.product, item.quantity));
    }
  } catch (error) {
    await restoreStock(reservations);
    throw error;
  }

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.originalPrice - item.finalPrice) * item.quantity,
    0,
  );
  const now = new Date();
  const context = clientContext(req, input);

  const draft = {
    orderNumber: await nextOrderNumber(),
    clientRequestId: requestId || undefined,
    customer: {
      name: input.customer.name.trim(),
      phone: input.customer.phone.replace(/\D/g, '').slice(-10),
      address: input.customer.address.trim(),
      notes: input.customer.notes?.trim() || '',
    },
    items: items.map(({ product, ...snapshot }) => snapshot),
    totalAmount,
    totalDiscount,
    paymentStatus: 'pending',
    orderStatus: 'whatsapp_redirected',
    whatsappRedirected: true,
    whatsappRedirectedAt: now,
    timeline: [
      { status: 'order_created', note: 'Order saved from the shop.', at: now },
      { status: 'whatsapp_redirected', note: 'Customer was sent to WhatsApp. This does not confirm the order was sent.', at: now },
    ],
  };
  draft.whatsappMessage = buildWhatsappMessage(draft);

  let order;
  try {
    order = await Order.create(draft);
  } catch (error) {
    await restoreStock(reservations);
    if (error.code === 11000 && requestId) {
      const existing = await Order.findOne({ clientRequestId: requestId });
      if (existing) return presentOrder(existing, buildWhatsappUrl(whatsappNumber, existing.whatsappMessage));
    }
    throw error;
  }

  await recordEvent({
    eventType: 'order_created',
    orderId: order._id,
    sessionId: input.sessionId,
    metadata: {
      totalAmount,
      deviceType: context.deviceType,
      browser: context.browser,
      referrer: context.referrer,
    },
  });

  await recordEvent({
    eventType: 'whatsapp_click',
    orderId: order._id,
    sessionId: input.sessionId,
    metadata: {
      totalAmount,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      deviceType: context.deviceType,
      browser: context.browser,
      referrer: context.referrer,
      redirectStatus: 'link_created',
    },
  });

  return presentOrder(order, buildWhatsappUrl(whatsappNumber, order.whatsappMessage));
}

export async function markWhatsappRedirect(orderId, input, req) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  const now = new Date();
  order.whatsappRedirected = true;
  order.whatsappRedirectedAt = now;
  if (order.orderStatus === 'not_ordered') order.orderStatus = 'whatsapp_redirected';
  order.timeline.push({
    status: 'whatsapp_redirected',
    note: 'WhatsApp was opened again.',
    at: now,
  });
  await order.save();

  const context = clientContext(req, input);
  await recordEvent({
    eventType: 'whatsapp_click',
    orderId: order._id,
    sessionId: input.sessionId,
    metadata: {
      totalAmount: order.totalAmount,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      deviceType: context.deviceType,
      browser: context.browser,
      referrer: context.referrer,
      redirectStatus: 'link_reopened',
    },
  });

  const number = await resolveWhatsappNumber();
  return presentOrder(order, buildWhatsappUrl(number, order.whatsappMessage));
}

export async function listOrders(query) {
  const page = clampNumber(query.page, 1, 500, 1);
  const limit = clampNumber(query.limit, 1, 50, 20);
  const filter = {};

  if (ORDER_STATUSES.includes(query.orderStatus)) filter.orderStatus = query.orderStatus;
  if (PAYMENT_STATUSES.includes(query.paymentStatus)) filter.paymentStatus = query.paymentStatus;

  if (query.search) {
    const term = escapeRegex(String(query.search).trim().slice(0, 60));
    filter.$or = [
      { orderNumber: { $regex: term, $options: 'i' } },
      { 'customer.name': { $regex: term, $options: 'i' } },
      { 'customer.phone': { $regex: term, $options: 'i' } },
    ];
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);

  return {
    items: orders.map((order) => presentOrder(order)),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getOrder(id) {
  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found.', 404);
  const number = await resolveWhatsappNumber();
  return presentOrder(order, buildWhatsappUrl(number, order.whatsappMessage));
}

async function pushStatus(order, status, note) {
  order.timeline.push({ status, note: note?.trim() || '', at: new Date() });
  await order.save();
  return getOrder(order._id);
}

export async function updateOrderStatus(id, { orderStatus, note }) {
  if (!ORDER_STATUSES.includes(orderStatus)) {
    throw new AppError('Choose a valid order status.', 422);
  }
  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found.', 404);
  order.orderStatus = orderStatus;
  return pushStatus(order, orderStatus, note);
}

export async function updatePaymentStatus(id, { paymentStatus, note }) {
  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new AppError('Choose a valid payment status.', 422);
  }
  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found.', 404);
  order.paymentStatus = paymentStatus;
  return pushStatus(order, `payment_${paymentStatus}`, note || `Payment marked ${paymentStatus}.`);
}
