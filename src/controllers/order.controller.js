import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createOrder,
  getOrder,
  listOrders,
  markWhatsappRedirect,
  updateOrderStatus,
  updatePaymentStatus,
} from '../services/order.service.js';

export const postOrder = asyncHandler(async (req, res) => {
  const order = await createOrder(req.body, req);
  res.status(201).json({
    success: true,
    order,
    notice: 'The order is saved and WhatsApp is ready. Sending the message is still up to the customer.',
  });
});

export const postWhatsapp = asyncHandler(async (req, res) => {
  const order = await markWhatsappRedirect(req.params.id, req.body, req);
  res.json({ success: true, order });
});

export const getOrders = asyncHandler(async (req, res) => {
  const result = await listOrders(req.query);
  res.json({ success: true, ...result });
});

export const getOneOrder = asyncHandler(async (req, res) => {
  const order = await getOrder(req.params.id);
  res.json({ success: true, order });
});

export const patchStatus = asyncHandler(async (req, res) => {
  const order = await updateOrderStatus(req.params.id, req.body);
  res.json({ success: true, order });
});

export const patchPayment = asyncHandler(async (req, res) => {
  const order = await updatePaymentStatus(req.params.id, req.body);
  res.json({ success: true, order });
});
