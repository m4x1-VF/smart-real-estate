-- 003_properties.sql
-- Catálogo de propiedades inmobiliarias publicadas en el sitio.

create table public.properties (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  price         numeric(12, 2) not null check (price >= 0),
  type          public.property_type not null,
  location      text not null,
  lat           numeric(9, 6),
  lng           numeric(9, 6),
  beds          integer not null check (beds >= 0),
  baths         integer not null check (baths >= 0),
  parking       integer check (parking >= 0),
  sqft          integer not null check (sqft >= 0),
  year_built    integer check (year_built between 1800 and extract(year from now())::int + 1),
  images        text[] not null default '{}',
  amenities     text[] not null default '{}',
  is_active     boolean not null default true,
  is_featured   boolean not null default false,
  is_new        boolean not null default true,
  slug          text unique,
  created_at    timestamptz not null default now()
);

create index properties_is_active_idx   on public.properties (is_active);
create index properties_is_featured_idx on public.properties (is_featured);
create index properties_type_idx        on public.properties (type);
create index properties_price_idx       on public.properties (price);
create index properties_created_at_idx  on public.properties (created_at desc);
