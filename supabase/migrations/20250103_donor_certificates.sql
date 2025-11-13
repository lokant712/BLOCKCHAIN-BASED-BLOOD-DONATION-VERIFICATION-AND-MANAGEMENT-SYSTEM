-- Create donor_certificates table for blockchain verification
-- This stores certificate metadata and links to blockchain records

create table if not exists donor_certificates (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references auth.users(id) on delete cascade,
  file_path text not null,          -- Supabase storage path (e.g., 'certificates/user-id/cert.pdf')
  cert_hash text,                    -- SHA-256 hash as hex string (0x...)
  eligible boolean default null,     -- null = pending, true = approved, false = rejected
  tx_hash text,                      -- Blockchain transaction hash after verification
  chain_address text,                -- Smart contract address (for reference)
  admin_notes text,                  -- Admin comments during review
  created_at timestamptz default now(),
  verified_at timestamptz,           -- When blockchain record was created
  reviewed_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists donor_certificates_donor_id_idx on donor_certificates(donor_id);
create index if not exists donor_certificates_eligible_idx on donor_certificates(eligible);
create index if not exists donor_certificates_cert_hash_idx on donor_certificates(cert_hash);

-- Enable Row Level Security
alter table donor_certificates enable row level security;

-- Policy: Donors can view their own certificates
create policy "Donors can view own certificates"
  on donor_certificates
  for select
  using (auth.uid() = donor_id);

-- Policy: Donors can insert their own certificates
create policy "Donors can upload certificates"
  on donor_certificates
  for insert
  with check (auth.uid() = donor_id);

-- Policy: Hospital can view all certificates
create policy "Hospital can view all certificates"
  on donor_certificates
  for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'hospital'
    )
  );

-- Policy: Hospital can update certificate status
create policy "Hospital can update certificates"
  on donor_certificates
  for update
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'hospital'
    )
  );

-- Create storage bucket for certificates if not exists
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- Storage policies for certificates bucket
-- Donors can upload their own certificates
create policy "Donors can upload own certificates"
  on storage.objects
  for insert
  with check (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Donors can view their own certificates
create policy "Donors can view own certificates"
  on storage.objects
  for select
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Hospital can view all certificates
create policy "Hospital can view all certificates storage"
  on storage.objects
  for select
  using (
    bucket_id = 'certificates'
    and exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
      and user_profiles.role = 'hospital'
    )
  );

-- Function to automatically update updated_at timestamp
create or replace function update_donor_certificates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on row update
create trigger donor_certificates_updated_at
  before update on donor_certificates
  for each row
  execute function update_donor_certificates_updated_at();
