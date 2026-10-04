import { asyncHandler } from '../utils/asyncHandler.js';
import { getAdminProfile, loginAdmin } from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const result = await loginAdmin(req.body);
  res.json({ success: true, ...result });
});

export const me = asyncHandler(async (req, res) => {
  const admin = await getAdminProfile(req.admin.id);
  res.json({
    success: true,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
});
