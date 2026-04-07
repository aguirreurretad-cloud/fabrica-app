-- Agrega campos de ganancia y facturación a pedidos
-- Ejecutar en: Supabase → SQL Editor → New query

alter table pedidos
  add column if not exists costo_total  numeric(12,2) default 0,
  add column if not exists facturado    boolean       not null default false;
