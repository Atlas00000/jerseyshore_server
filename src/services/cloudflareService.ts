import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger.js';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // R2 requires path-style URLs
  tls: true, // Enable TLS
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'threejs-assets';

/**
 * Upload a file to Cloudflare R2
 * @param key - Object key (path) in R2 bucket
 * @param file - File buffer or stream
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
  key: string,
  file: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  try {
    logger.info('Uploading to R2', {
      context: 'CloudflareService',
      metadata: {
        key,
        contentType,
        size: file.length,
        bucket: BUCKET_NAME,
      },
    });

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // Return public URL
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
    
    logger.info('R2 upload successful', {
      context: 'CloudflareService',
      metadata: { key, publicUrl },
    });

    return publicUrl;
  } catch (error) {
    logger.error('Error uploading to R2', {
      context: 'CloudflareService',
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { key, contentType, bucket: BUCKET_NAME },
    });
    throw new Error(`Failed to upload to R2: ${error}`);
  }
}

/**
 * Generate a signed URL for uploading (for client-side uploads)
 * @param key - Object key (path) in R2 bucket
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL for uploading
 */
export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error('Error generating upload URL', {
      context: 'CloudflareService',
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { key, contentType },
    });
    throw new Error(`Failed to generate upload URL: ${error}`);
  }
}

/**
 * Generate a signed URL for downloading (for private files)
 * @param key - Object key (path) in R2 bucket
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL for downloading
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    logger.error('Error generating download URL', {
      context: 'CloudflareService',
      error: error instanceof Error ? error : new Error(String(error)),
      metadata: { key },
    });
    throw new Error(`Failed to generate download URL: ${error}`);
  }
}

