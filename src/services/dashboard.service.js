import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { CONFIRMED_ORDER_STATUSES, RECEIVED_ORDER_STATUSES } from '../constants/catalog.js';

function kolkataMidnight(daysAgo = 0) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const start = new Date(`${today}T00:00:00+05:30`);
  return new Date(start.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function fillDays(start, days, rows) {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    const key = dayKey(date);
    return { date: key, count: counts.get(key) || 0 };
  });
}

async function series(eventType, start, days) {
  const rows = await AnalyticsEvent.aggregate([
    { $match: { eventType, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
        count: { $sum: 1 },
      },
    },
  ]);
  return fillDays(start, days, rows);
}

async function topProducts(limit = 8) {
  const [events, ordered] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { eventType: { $in: ['product_view', 'add_to_cart'] }, productId: { $ne: null } } },
      { $group: { _id: '$productId', views: { $sum: { $cond: [{ $eq: ['$eventType', 'product_view'] }, 1, 0] } }, carts: { $sum: { $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0] } } } },
    ]),
    Order.aggregate([
      { $match: { whatsappRedirected: true } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', orders: { $sum: 1 } } },
    ]),
  ]);

  const merged = new Map();
  for (const row of [...events, ...ordered]) {
    const key = String(row._id);
    const current = merged.get(key) || { views: 0, carts: 0, orders: 0 };
    merged.set(key, {
      views: current.views + (row.views || 0),
      carts: current.carts + (row.carts || 0),
      orders: current.orders + (row.orders || 0),
    });
  }

  const ranked = [...merged.entries()]
    .map(([id, stats]) => ({ id, ...stats, interactions: stats.views + stats.carts + stats.orders }))
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, limit);

  const products = await Product.find({ _id: { $in: ranked.map((row) => row.id) } }).select('name');
  const names = new Map(products.map((product) => [String(product._id), product.name]));

  return ranked.map((row) => ({
    id: row.id,
    name: names.get(row.id) || 'Removed product',
    interactions: row.interactions,
    views: row.views,
    carts: row.carts,
    orders: row.orders,
  }));
}

export async function getDashboard(days = 30) {
  const safeDays = [7, 30].includes(Number(days)) ? Number(days) : 30;
  const today = kolkataMidnight(0);
  const last7 = kolkataMidnight(6);
  const rangeStart = kolkataMidnight(safeDays - 1);

  const [
    whatsappRedirects,
    orders,
    pendingPayments,
    confirmedOrders,
    revenueRows,
    totalProducts,
    activeProducts,
    outOfStock,
    totalCategories,
    redirectsToday,
    redirects7,
    redirects30,
    receivedOrders,
    cancelledOrders,
    redirectSeries,
    orderSeries,
    top,
  ] = await Promise.all([
    AnalyticsEvent.countDocuments({ eventType: 'whatsapp_click' }),
    Order.countDocuments(),
    Order.countDocuments({
      paymentStatus: 'pending',
      orderStatus: { $in: ['order_received', 'payment_pending', 'order_confirmed', 'processing', 'ready'] },
    }),
    Order.countDocuments({ orderStatus: { $in: CONFIRMED_ORDER_STATUSES } }),
    Order.aggregate([
      { $match: { paymentStatus: 'received' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stockStatus: 'out_of_stock' }),
    Category.countDocuments({ isActive: true }),
    AnalyticsEvent.countDocuments({ eventType: 'whatsapp_click', createdAt: { $gte: today } }),
    AnalyticsEvent.countDocuments({ eventType: 'whatsapp_click', createdAt: { $gte: last7 } }),
    AnalyticsEvent.countDocuments({ eventType: 'whatsapp_click', createdAt: { $gte: kolkataMidnight(29) } }),
    Order.countDocuments({ orderStatus: { $in: RECEIVED_ORDER_STATUSES } }),
    Order.countDocuments({ orderStatus: 'cancelled' }),
    series('whatsapp_click', rangeStart, safeDays),
    series('order_created', rangeStart, safeDays),
    topProducts(),
  ]);
  const whatsappContacts = await AnalyticsEvent.countDocuments({ eventType: 'whatsapp_contact' });

  const conversionBase = whatsappRedirects || 0;
  const conversionRate = conversionBase ? Number(((receivedOrders / conversionBase) * 100).toFixed(1)) : 0;

  return {
    kpis: {
      whatsappRedirects,
      whatsappContacts,
      orders,
      pendingPayments,
      confirmedOrders,
      revenue: revenueRows[0]?.total || 0,
      totalProducts,
      activeProducts,
      outOfStock,
      totalCategories,
    },
    redirects: {
      today: redirectsToday,
      last7: redirects7,
      last30: redirects30,
      series: redirectSeries,
    },
    ordersSeries: orderSeries,
    funnel: {
      whatsappRedirects,
      ordersReceived: receivedOrders,
      confirmedOrders,
      cancelledOrders,
    },
    conversion: {
      whatsappRedirects,
      ordersReceived: receivedOrders,
      rate: conversionRate,
      label: 'Orders received divided by recorded WhatsApp clicks. A click does not mean the customer sent the message.',
    },
    topProducts: top,
  };
}
