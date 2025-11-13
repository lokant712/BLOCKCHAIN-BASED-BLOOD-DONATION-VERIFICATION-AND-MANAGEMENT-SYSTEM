/**
 * Setup Storage Bucket for Certificates
 * This script creates the certificates bucket in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorageBucket() {
  console.log('🚀 Setting up certificates storage bucket...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'certificates');

    if (bucketExists) {
      console.log('✅ Bucket "certificates" already exists');
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('certificates', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
      });

      if (error) {
        throw new Error(`Failed to create bucket: ${error.message}`);
      }

      console.log('✅ Created bucket "certificates"');
    }

    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase Dashboard SQL Editor');
    console.log('2. Run the storage policies from the migration file:');
    console.log('   supabase/migrations/20250103_donor_certificates.sql');
    console.log('3. Look for the storage policies section (lines 64-89)');
    console.log('\nOr run this SQL directly:\n');
    
    console.log(`
-- Storage policies for certificates bucket
create policy "Donors can upload own certificates"
  on storage.objects
  for insert
  with check (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Donors can view own certificates"
  on storage.objects
  for select
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Hospital and Admin can view all certificates"
  on storage.objects
  for select
  using (
    bucket_id = 'certificates'
    and exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role in ('hospital', 'admin')
    )
  );
    `);

    console.log('\n✅ Setup complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setupStorageBucket();
