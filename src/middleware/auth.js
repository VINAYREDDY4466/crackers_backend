import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return next(new AppError('Please log in to continue.', 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.role !== 'admin' || !payload.sub) {
      return next(new AppError('You do not have access to this area.', 403));
    }
    req.admin = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(new AppError('Your session has expired. Please log in again.', 401));
  }
}
