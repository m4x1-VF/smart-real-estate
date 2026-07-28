-- Fix: better-auth expects camelCase column names
-- Add expiresAt column to verification table (better-auth uses camelCase)
alter table public.verification add column "expiresAt" timestamptz;

-- Copy data from snake_case to camelCase
update public.verification set "expiresAt" = expires_at;

-- Make it NOT NULL after copying
alter table public.verification alter column "expiresAt" set not null;

-- Drop old column if needed (optional, keeping for backward compatibility)
-- alter table public.verification drop column expires_at;
