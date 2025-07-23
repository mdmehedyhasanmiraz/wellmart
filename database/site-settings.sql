-- Site Settings Table for global site configuration
create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  logo_url text,
  bank_details jsonb,
  updated_at timestamp with time zone default now()
); 