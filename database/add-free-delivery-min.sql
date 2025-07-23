-- Add free_delivery_min column to site_settings for free delivery threshold
alter table site_settings add column if not exists free_delivery_min numeric default 799; 