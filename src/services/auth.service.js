import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export async function loginAdmin({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' }).select('+passwordHash');
  if (!user) {
    throw new AppError('Email or password is incorrect.', 401);
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw new AppError('Email or password is incorrect.', 401);
  }

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return {
    token,
    admin: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
}

export async function getAdminProfile(adminId) {
  const user = await User.findById(adminId).select('name email role');
  if (!user) throw new AppError('Account not found.', 401);
  return user;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
