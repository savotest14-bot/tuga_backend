import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { r2StorageInstance } from '../common/services/r2-storage.service';

async function main() {
  console.log('==================================================');
  console.log('       Cloudflare R2 Connection Diagnostic        ');
  console.log('==================================================');

  console.log('Bucket Name:', process.env.R2_BUCKET_NAME || '(not set)');
  console.log('Endpoint:   ', process.env.R2_ENDPOINT || '(not set)');
  console.log('Access Key: ', process.env.R2_ACCESS_KEY_ID ? `${process.env.R2_ACCESS_KEY_ID.substring(0, 8)}...` : '(not set)');
  console.log('Public URL: ', process.env.R2_PUBLIC_URL || '(default / not set)');
  console.log('--------------------------------------------------');

  if (!r2StorageInstance.isConfigured()) {
    console.error('❌ Cloudflare R2 is NOT configured properly in .env!');
    process.exit(1);
  }

  console.log('Testing upload & delete to Cloudflare R2...');
  const result = await r2StorageInstance.testConnection();

  if (result.success) {
    console.log('✅ SUCCESS:', result.message);
    console.log('Cloudflare R2 is fully working! All uploads will be saved to R2.');
  } else {
    console.warn('⚠️ WARNING:', result.message);
    console.log('');
    console.log('Fallback Status: ACTIVE');
    console.log('--------------------------------------------------');
    console.log('Since R2 is not currently accepting uploads, the system will');
    console.log('automatically and safely save all files to local storage (./uploads).');
    console.log('No user uploads will be lost or fail.');
    console.log('');
    console.log('To enable R2 uploads:');
    console.log('1. Go to Cloudflare Dashboard -> R2 Object Storage -> Manage R2 API Tokens');
    console.log(`2. Verify that your API Token has "Object Read & Write" permission for bucket "${process.env.R2_BUCKET_NAME || 'tugatrades-developer'}".`);
    console.log('3. Ensure no IP access restrictions on the token prevent this server from connecting.');
  }
  console.log('==================================================');
}

main().catch((err) => {
  console.error('Unexpected error running R2 test:', err);
});
