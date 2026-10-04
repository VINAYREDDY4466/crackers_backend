import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { sniffImage } from '../middleware/upload.js';

let client;

function s3() {
  if (!isStorageConfigured()) {
    throw new AppError('Image storage is not configured. Add AWS S3 settings before uploading.', 503);
  }
  if (!client) {
    const { region, accessKeyId, secretAccessKey } = env.aws;
    // Without keys the SDK falls back to the EC2 instance role.
    const credentials = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;
    client = new S3Client({ region, credentials });
  }
  return client;
}

export function isStorageConfigured() {
  return Boolean(env.aws.region && env.aws.bucket);
}

async function send(command) {
  try {
    return await s3().send(command);
  } catch (error) {
    if (error.name === 'CredentialsProviderError') {
      throw new AppError('Image storage has no AWS credentials. Attach an IAM role or set access keys.', 503);
    }
    throw error;
  }
}

function extensionFor(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadBuffer({ buffer, folder }) {
  const mime = sniffImage(buffer);
  if (!mime) {
    throw new AppError('Upload a valid JPG, PNG, or WEBP image.', 400);
  }

  const key = `${folder}/${Date.now()}-${randomBytes(6).toString('hex')}.${extensionFor(mime)}`;
  await send(new PutObjectCommand({
    Bucket: env.aws.bucket,
    Key: key,
    Body: buffer,
    ContentType: mime,
    CacheControl: 'public, max-age=31536000',
  }));

  const imageUrl = `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
  return { imageUrl, imageKey: key };
}

export async function deleteStoredImage(imageKey) {
  if (!imageKey || !isStorageConfigured()) return;
  await send(new DeleteObjectCommand({
    Bucket: env.aws.bucket,
    Key: imageKey,
  }));
}
