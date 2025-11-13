-- Add donor_wallet_address column to donor_certificates table
-- This stores the Ethereum wallet address provided by the donor during upload

ALTER TABLE donor_certificates 
ADD COLUMN IF NOT EXISTS donor_wallet_address text;

-- Add index for wallet address lookups
CREATE INDEX IF NOT EXISTS donor_certificates_wallet_address_idx 
ON donor_certificates(donor_wallet_address);

-- Add comment
COMMENT ON COLUMN donor_certificates.donor_wallet_address IS 'Ethereum wallet address provided by donor during certificate upload';
