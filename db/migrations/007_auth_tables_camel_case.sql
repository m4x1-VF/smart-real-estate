-- 007_auth_tables_camel_case.sql
-- better-auth expects camelCase column names.
-- Rename all snake_case columns in auth tables to camelCase.

-- ═══════════════════════════════════════════════════
-- 1. Tabla "user"
-- ═══════════════════════════════════════════════════
alter table public."user" rename column email_verified to "emailVerified";
alter table public."user" rename column created_at to "createdAt";
alter table public."user" rename column updated_at to "updatedAt";

-- ═══════════════════════════════════════════════════
-- 2. Tabla session
-- ═══════════════════════════════════════════════════
drop index if exists public.session_user_id_idx;
alter table public.session rename column expires_at to "expiresAt";
alter table public.session rename column ip_address to "ipAddress";
alter table public.session rename column user_agent to "userAgent";
alter table public.session rename column user_id to "userId";
alter table public.session rename column created_at to "createdAt";
alter table public.session rename column updated_at to "updatedAt";
create index session_user_id_idx on public.session ("userId");

-- ═══════════════════════════════════════════════════
-- 3. Tabla account
-- ═══════════════════════════════════════════════════
drop index if exists public.account_user_id_idx;
alter table public.account rename column account_id to "accountId";
alter table public.account rename column provider_id to "providerId";
alter table public.account rename column user_id to "userId";
alter table public.account rename column access_token to "accessToken";
alter table public.account rename column refresh_token to "refreshToken";
alter table public.account rename column id_token to "idToken";
alter table public.account rename column access_token_expires_at to "accessTokenExpiresAt";
alter table public.account rename column refresh_token_expires_at to "refreshTokenExpiresAt";
alter table public.account rename column created_at to "createdAt";
alter table public.account rename column updated_at to "updatedAt";
create index account_user_id_idx on public.account ("userId");

-- ═══════════════════════════════════════════════════
-- 4. Tabla verification
-- ═══════════════════════════════════════════════════
drop index if exists public.verification_identifier_idx;
alter table public.verification rename column expires_at to "expiresAt";
alter table public.verification rename column created_at to "createdAt";
alter table public.verification rename column updated_at to "updatedAt";
create index verification_identifier_idx on public.verification (identifier);
