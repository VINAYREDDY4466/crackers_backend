import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeBody } from './middleware/sanitize.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { AppError } from './utils/AppError.js';

const app = express();
//here we are dfdisabling the x-powered-by header to prevent the server from being identified as a Node.js server
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    const localDev = env.nodeEnv !== 'production'
      && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (localDev) {
      callback(null, true);
      return;
    }
    callback(new AppError('Origin not allowed', 403));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeBody);
app.use(apiLimiter);

if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
