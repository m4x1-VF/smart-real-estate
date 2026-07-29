-- 008_favorites.sql
-- Tabla de propiedades favoritas por usuario.
-- PK compuesta (user_id, property_id) actúa como UNIQUE natural y permite
-- INSERT ... ON CONFLICT DO NOTHING para toggle idempotente.

create table public.favorites (
  user_id      text not null references public."user"(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index favorites_user_id_idx on public.favorites (user_id);
