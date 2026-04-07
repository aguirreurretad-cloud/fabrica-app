-- Agrega precio de costo x bulto a productos
-- Ejecutar en: Supabase → SQL Editor → New query

alter table productos
  add column if not exists precio_costo_bulto numeric(12,2);
