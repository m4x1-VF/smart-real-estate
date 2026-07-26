-- 005_functions.sql
-- Funciones de autorización usadas por el adaptador (vía GUC app.current_user_id).
-- SECURITY DEFINER + search_path fijo: las queries internas no pueden ser
-- redirigidas a otros schemas.

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
    where user_id = current_setting('app.current_user_id', true)::uuid
      and role = 'admin'
  );
$$;

create or replace function public.ensure_user_role()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := current_setting('app.current_user_id', true)::uuid;
begin
  if uid is null then
    return;
  end if;

  insert into public.user_roles (user_id, role)
  values (uid, 'user')
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.get_admin_users()
returns table (id uuid, email text, role public.app_role)
language sql
stable
security definer
set search_path = public
as $$
  -- Placeholder: ajustar cuando exista la tabla real de usuarios.
  -- Hoy devuelve los user_id de admins con email vacío.
  select ur.user_id as id, ''::text as email, ur.role
  from public.user_roles ur
  where ur.role = 'admin';
$$;
