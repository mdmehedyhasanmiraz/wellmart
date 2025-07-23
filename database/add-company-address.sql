-- Add address column to companies table
alter table companies add column if not exists address text; 