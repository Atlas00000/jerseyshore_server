import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    });

    console.log('Testing R2 connection...');
    console.log('Endpoint:', `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    console.log('Access Key ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.substring(0, 10) + '...');

    // Try to list buckets (simple test)
    const command = new ListBucketsCommand({});
    const response = await client.send(command);
    
    console.log('✅ Connection successful!');
    console.log('Buckets:', response.Buckets?.map(b => b.Name));
  } catch (error) {
    console.error('❌ Connection failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error code:', (error as any).code);
    }
  }
}

testConnection();



