-- Storage policies for certificates bucket
-- Run this in Supabase SQL Editor after creating the 'certificates' bucket

-- Policy: Donors can upload their own certificates
CREATE POLICY "Donors can upload own certificates"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Donors can view their own certificates
CREATE POLICY "Donors can view own certificates"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Hospital staff can view all certificates
CREATE POLICY "Hospital can view all certificates"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'hospital'
    )
  );
