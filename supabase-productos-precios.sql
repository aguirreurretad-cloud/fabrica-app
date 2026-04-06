-- =============================================
-- Agrega columnas de precios escalonados a productos
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

alter table productos
  add column if not exists precio_mayorista numeric(12,2),
  add column if not exists precio_mayorista_max numeric(12,2),
  add column if not exists cantidad_mayorista_max integer;
