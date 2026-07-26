-- 004_user_roles.sql
-- Relación usuario → rol para autorización. Una fila por usuario.
-- user_id no tiene FK intencionalmente: se define cuando se elija la
-- tabla real de usuarios del proveedor de auth (NextAuth / Clerk / etc.).

create table public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  role    public.app_role not null default 'user'
);

create index user_roles_user_id_idx on public.user_roles (user_id);
