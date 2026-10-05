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

const STORAGE_ERRORS = {
  CredentialsProviderError: 'Image storage has no AWS credentials. Attach an IAM role or set access keys.',
  InvalidAccessKeyId: 'The AWS access key is invalid or deleted. Update or remove the AWS keys in .env.',
  SignatureDoesNotMatch: 'The AWS secret access key is wrong. Update or remove the AWS keys in .env.',
  AccessDenied: 'AWS denied the upload. Check the IAM policy allows this bucket and folder.',
  NoSuchBucket: 'The S3 bucket does not exist. Check AWS_S3_BUCKET.',
  PermanentRedirect: 'The S3 bucket is in a different region. Check AWS_REGION.',
  AuthorizationHeaderMalformed: 'The S3 bucket is in a different region. Check AWS_REGION.',
};

async function send(command) {
  try {
    return await s3().send(command);
  } catch (error) {
    const message = STORAGE_ERRORS[error.name];
    if (!message) throw error;
    console.error(`S3 ${error.name}: ${error.message}`);
    throw new AppError(message, 503);
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
