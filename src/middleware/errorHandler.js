import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFound(_req, _res, next) {
  next(new AppError('The requested resource was not found.', 404));
}

export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';

  if (err.code === 11000) {
    status = 409;
    message = 'A record with this value already exists.';
  } else if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors)[0]?.message || 'Please check the form and try again.';
  } else if (err.name === 'CastError' || err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid identifier.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'The request is too large.';
  }

  if (status >= 500) {
    if (!err.statusCode || err.statusCode === 500) console.error(err);
    if (env.nodeEnv === 'production') {
      message = 'Something went wrong. Please try again.';
    }
  }

  res.status(status).json({ success: false, message });
}
