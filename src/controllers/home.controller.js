import { asyncHandler } from '../utils/asyncHandler.js';
import { getHomeData } from '../services/home.service.js';

export const getHome = asyncHandler(async (_req, res) => {
  const data = await getHomeData();
  res.json({ success: true, ...data });
});
