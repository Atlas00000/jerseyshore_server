import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { uploadToR2 } from '../src/services/cloudflareService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to upload material textures to Cloudflare R2
 * Supports: PNG, JPG, JPEG, WEBP, HDR, EXR formats
 * 
 * Usage:
 *   pnpm tsx scripts/uploadMaterials.ts <materials-directory>
 * 
 * Example:
 *   pnpm tsx scripts/uploadMaterials.ts ./assets/materials
 */
async function uploadMaterials(materialsDir: string) {
  try {
    console.log('📦 Starting material upload to R2...\n');
    console.log('Materials directory:', materialsDir);
    console.log('Bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
    console.log('Account ID:', process.env.CLOUDFLARE_ACCOUNT_ID);
    console.log('Public URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL);
    console.log('');

    if (!materialsDir) {
      throw new Error('Please provide a materials directory path');
    }

    const supportedFormats = ['.png', '.jpg', '.jpeg', '.webp', '.hdr', '.exr'];
    const uploadedFiles: string[] = [];
    const failedFiles: Array<{ path: string; error: string }> = [];

    /**
     * Recursively walk directory and collect files to upload
     */
    function collectFiles(dir: string, baseDir: string, fileList: Array<{ path: string; r2Key: string; ext: string }>): void {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          collectFiles(fullPath, baseDir, fileList);
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();
          
          if (supportedFormats.includes(ext)) {
            // Calculate relative path from base directory
            const relativePath = fullPath.replace(baseDir, '').replace(/^[\/\\]/, '');
            // Normalize path separators to forward slashes for R2
            const r2Key = `textures/materials/${relativePath.replace(/\\/g, '/')}`;
            
            fileList.push({ path: fullPath, r2Key, ext });
          }
        }
      }
    }

    /**
     * Upload a single file to R2
     */
    async function uploadFile(filePath: string, r2Key: string, ext: string): Promise<void> {
      try {
        const fileBuffer = readFileSync(filePath);
        const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
        
        // Determine content type based on extension
        const contentTypeMap: Record<string, string> = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
          '.hdr': 'image/vnd.radiance',
          '.exr': 'image/x-exr',
        };
        
        const contentType = contentTypeMap[ext] || 'application/octet-stream';
        
        console.log(`📤 Uploading: ${r2Key} (${fileSize} MB)`);
        
        const publicUrl = await uploadToR2(r2Key, fileBuffer, contentType);
        uploadedFiles.push(publicUrl);
        
        console.log(`   ✅ Success: ${publicUrl}\n`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed: ${errorMsg}\n`);
        failedFiles.push({ path: filePath, error: errorMsg });
      }
    }

    // Collect all files to upload
    const absolutePath = join(process.cwd(), materialsDir);
    console.log('Scanning directory:', absolutePath);
    console.log('');
    
    const filesToUpload: Array<{ path: string; r2Key: string; ext: string }> = [];
    collectFiles(absolutePath, absolutePath, filesToUpload);
    
    console.log(`Found ${filesToUpload.length} files to upload\n`);
    
    // Upload files sequentially (to avoid overwhelming R2)
    for (const file of filesToUpload) {
      await uploadFile(file.path, file.r2Key, file.ext);
      // Small delay between uploads to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successfully uploaded: ${uploadedFiles.length} files`);
    console.log(`❌ Failed: ${failedFiles.length} files`);
    
    if (failedFiles.length > 0) {
      console.log('\nFailed files:');
      failedFiles.forEach(({ path, error }) => {
        console.log(`  - ${path}: ${error}`);
      });
    }
    
    if (uploadedFiles.length > 0) {
      console.log('\n✅ All uploaded files are available at:');
      console.log(`   ${process.env.CLOUDFLARE_R2_PUBLIC_URL}/textures/materials/`);
    }
    
    console.log('');
  } catch (error) {
    console.error('❌ Upload failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Get materials directory from command line argument
const materialsDir = process.argv[2];

if (!materialsDir) {
  console.error('❌ Error: Please provide a materials directory path');
  console.error('Usage: pnpm tsx scripts/uploadMaterials.ts <materials-directory>');
  console.error('Example: pnpm tsx scripts/uploadMaterials.ts ./assets/materials');
  process.exit(1);
}

uploadMaterials(materialsDir);

