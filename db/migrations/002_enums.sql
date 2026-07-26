-- 002_enums.sql
-- Enums de dominio. Se referencian desde tablas y funciones.

create type public.property_type as enum ('sale', 'rent');
create type public.app_role as enum ('admin', 'user');
