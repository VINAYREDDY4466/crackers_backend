import dotenv from 'dotenv';

dotenv.config();

const PLACEHOLDER_SECRET = 'replace-with-a-long-random-secret';
const MIN_SECRET_LENGTH = 32;

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function jwtSecret(nodeEnv) {
  const secret = required('JWT_SECRET');
  const weak = secret === PLACEHOLDER_SECRET || secret.length < MIN_SECRET_LENGTH;
  if (nodeEnv === 'production' && weak) {
    throw new Error(`JWT_SECRET must be a random value of at least ${MIN_SECRET_LENGTH} characters in production.`);
  }
  return secret;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5174';

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5050),
  mongoUri: required('MONGO_URI'),
  jwtSecret: jwtSecret(nodeEnv),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  clientOrigins: clientOrigin.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean),
  whatsappNumber: (process.env.WHATSAPP_NUMBER || '').replace(/\D/g, ''),
  seed: {
    email: process.env.SEED_ADMIN_EMAIL || '',
    password: process.env.SEED_ADMIN_PASSWORD || '',
    name: process.env.SEED_ADMIN_NAME || 'Shop Admin',
  },
  aws: {
    region: process.env.AWS_REGION || '',
    bucket: process.env.AWS_S3_BUCKET || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};