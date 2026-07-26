-- 006_auth_tables.sql
-- Tablas de better-auth + integración con user_roles existente.

-- 1. Tabla user (better-auth core)
create table public."user" (
  id             text primary key,
  name           text not null,
  email          text not null unique,
  email_verified boolean not null default false,
  image          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2. Tabla session
create table public.session (
  id         text primary key,
  expires_at timestamptz not null,
  token      text not null unique,
  ip_address text,
  user_agent text,
  user_id    text not null references public."user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index session_user_id_idx on public.session (user_id);

-- 3. Tabla account
create table public.account (
  id                       text primary key,
  account_id               text not null,
  provider_id              text not null,
  user_id                  text not null references public."user"(id) on delete cascade,
  access_token             text,
  refresh_token            text,
  id_token                 text,
  access_token_expires_at  timestamptz,
  refresh_token_expires_at timestamptz,
  scope                    text,
  password                 text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index account_user_id_idx on public.account (user_id);

-- 4. Tabla verification
create table public.verification (
  id         text primary key,
  identifier text not null,
  value      text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index verification_identifier_idx on public.verification (identifier);

-- 5. Alter user_roles.user_id from uuid to text (better-auth uses text/nanoid IDs)
alter table public.user_roles
  alter column user_id type text;

-- 6. FK de user_roles hacia user (reemplaza la ausencia intencional de feature #1)
alter table public.user_roles
  add constraint user_roles_user_id_fk
  foreign key (user_id) references public."user"(id) on delete cascade;

-- 7. Actualizar get_admin_users() para JOIN con user table
create or replace function public.get_admin_users()
returns table (id text, email text, role public.app_role)
language sql
stable
security definer
set search_path = public
as $$
  select ur.user_id, u.email, ur.role
  from public.user_roles ur
  join public."user" u on u.id = ur.user_id
  where ur.role = 'admin';
$$;

-- 8. Actualizar is_admin() para usar text user_id
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = current_setting('app.current_user_id', true)
      and role = 'admin'
  );
$$;

-- 9. Actualizar ensure_user_role() para usar text user_id
create or replace function public.ensure_user_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := current_setting('app.current_user_id', true);
begin
  if uid is null or uid = '' then
    return;
  end if;

  insert into public.user_roles (user_id, role)
  values (uid, 'user')
  on conflict (user_id) do nothing;
end;
$$;
