-- Add is_home and position columns to categories table
alter table categories add column if not exists is_home boolean not null default true;
alter table categories add column if not exists position integer; 