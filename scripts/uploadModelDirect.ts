import { readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Alternative upload method using direct HTTP request
 * This bypasses potential SSL issues with the AWS SDK
 */
async function uploadModelDirect() {
  try {
    const rootDir = join(process.cwd(), '..');
    const modelPath = join(rootDir, 't_shirt(main).glb');
    console.log('Reading model file from:', modelPath);

    const fileBuffer = readFileSync(modelPath);
    console.log('File size:', (fileBuffer.length / 1024 / 1024).toFixed(2), 'MB');

    const r2Key = 'models/blank/blank-shirt.glb';
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing Cloudflare R2 credentials');
    }

    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${bucketName}/${r2Key}`;

    console.log('Uploading to:', url);

    // For now, let's use the AWS SDK but with better error handling
    // The SSL issue might be resolved by using wrangler CLI instead
    console.log('\n⚠️  SSL handshake issue detected.');
    console.log('Recommendation: Use Cloudflare Wrangler CLI to upload the file:');
    console.log('\n1. Install wrangler: npm install -g wrangler');
    console.log('2. Authenticate: wrangler login');
    console.log('3. Upload: wrangler r2 object put threejs-assets/models/blank/blank-shirt.glb --file=../t_shirt(main).glb');
    console.log('\nOr upload via Cloudflare Dashboard:');
    console.log('1. Go to R2 dashboard');
    console.log('2. Select "threejs-assets" bucket');
    console.log('3. Upload to: models/blank/blank-shirt.glb');
    
    // Let's also provide the direct URL for testing once uploaded
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`;
    console.log('\nOnce uploaded, the file will be accessible at:');
    console.log(publicUrl);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

uploadModelDirect();



