-- 009_unaccent.sql
-- Función unaccent personalizada (no requiere extensión).
-- Normaliza textos eliminando acentos y diacríticos para búsquedas ILIKE.

create or replace function unaccent(input text)
returns text as $$
  select translate(
    lower(input),
    'áàâäãåéèêëíìîïóòôöõúùûüñçÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑÇ',
    'aaaaaaeeeeiiiioooouuuuncAAAAAAEEEEIIIIOOOOUUUUNC'
  );
$$ language sql immutable;
