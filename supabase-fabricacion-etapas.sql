-- =============================================
-- Agrega etapas de producción a la tabla producciones
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

alter table producciones
  add column if not exists etapa_actual integer not null default 0;
