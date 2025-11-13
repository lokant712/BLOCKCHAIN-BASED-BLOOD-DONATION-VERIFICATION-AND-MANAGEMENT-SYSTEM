-- Create donor_certificates table for blockchain verification
-- This stores certificate metadata and links to blockchain records

CREATE TABLE IF NOT EXISTS donor_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  cert_hash text,
  eligible boolean DEFAULT NULL,
  tx_hash text,
  chain_address text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS donor_certificates_donor_id_idx ON donor_certificates(donor_id);
CREATE INDEX IF NOT EXISTS donor_certificates_eligible_idx ON donor_certificates(eligible);
CREATE INDEX IF NOT EXISTS donor_certificates_cert_hash_idx ON donor_certificates(cert_hash);

-- Enable Row Level Security
ALTER TABLE donor_certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Donors can view own certificates" ON donor_certificates;
DROP POLICY IF EXISTS "Donors can upload certificates" ON donor_certificates;
DROP POLICY IF EXISTS "Hospital can view all certificates" ON donor_certificates;
DROP POLICY IF EXISTS "Hospital can update certificates" ON donor_certificates;

-- Policy: Donors can view their own certificates
CREATE POLICY "Donors can view own certificates"
  ON donor_certificates
  FOR SELECT
  USING (auth.uid() = donor_id);

-- Policy: Donors can insert their own certificates
CREATE POLICY "Donors can upload certificates"
  ON donor_certificates
  FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- Policy: Hospital can view all certificates
CREATE POLICY "Hospital can view all certificates"
  ON donor_certificates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'hospital'
    )
  );

-- Policy: Hospital can update certificate status
CREATE POLICY "Hospital can update certificates"
  ON donor_certificates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'hospital'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donor_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS donor_certificates_updated_at ON donor_certificates;

-- Trigger to update updated_at on row update
CREATE TRIGGER donor_certificates_updated_at
  BEFORE UPDATE ON donor_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_donor_certificates_updated_at();
