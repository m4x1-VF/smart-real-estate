-- 009_unaccent.sql
-- Función strip_accents personalizada (no requiere extensión).
-- Normaliza textos eliminando acentos y diacríticos para búsquedas ILIKE.

create or replace function strip_accents(input text)
returns text as $$
  select translate(
    lower(input),
    'áàâäãåéèêëíìîïóòôöõúùûüñçÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÜÑÇ',
    'aaaaaaeeeeiiiioooouuuuncAAAAAAEEEEIIIIOOOOUUUUNC'
  );
$$ language sql immutable;
