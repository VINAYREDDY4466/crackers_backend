import { asyncHandler } from '../utils/asyncHandler.js';
import { trackPublicEvent } from '../services/analytics.service.js';
import { getDashboard } from '../services/dashboard.service.js';

export const postEvent = asyncHandler(async (req, res) => {
  await trackPublicEvent(req.body, req);
  res.status(201).json({ success: true });
});

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.query.days);
  res.json({ success: true, ...data });
});
