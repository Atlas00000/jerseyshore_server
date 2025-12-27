import { readFileSync } from 'fs';
import { join } from 'path';
import { uploadToR2 } from '../src/services/cloudflareService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to upload the t-shirt model to Cloudflare R2
 */
async function uploadModel() {
  try {
    // Get the model file from the root directory (one level up from server/)
    const rootDir = join(process.cwd(), '..');
    const modelPath = join(rootDir, 't_shirt(main).glb');
    console.log('Reading model file from:', modelPath);

    const fileBuffer = readFileSync(modelPath);
    console.log('File size:', (fileBuffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Upload to R2 at models/blank/blank-shirt.glb
    const r2Key = 'models/blank/blank-shirt.glb';
    console.log('Uploading to R2:', r2Key);
    console.log('Bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
    console.log('Account ID:', process.env.CLOUDFLARE_ACCOUNT_ID);
    console.log('Access Key ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.substring(0, 10) + '...');
    console.log('Secret Key:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing');
    console.log('Endpoint:', `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`);

    const publicUrl = await uploadToR2(r2Key, fileBuffer, 'model/gltf-binary');

    console.log('\n✅ Upload successful!');
    console.log('Public URL:', publicUrl);
    console.log('\nYou can now use this URL in your client to load the model.');
    console.log('Expected client URL:', `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`);
  } catch (error) {
    console.error('❌ Upload failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

uploadModel();

