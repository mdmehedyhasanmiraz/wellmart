-- Table for storing code snippets to inject into the site
create table if not exists code_snippets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null check (location in ('header', 'body', 'footer')),
  code text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
); 