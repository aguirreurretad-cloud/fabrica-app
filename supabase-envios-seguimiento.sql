-- =============================================
-- Tabla: envios_seguimiento
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

create table if not exists envios_seguimiento (
  id uuid default uuid_generate_v4() primary key,
  tracking_number text not null unique,
  estado text,
  detalle text,
  last_checked_at timestamptz,
  created_at timestamptz default now()
);

alter table envios_seguimiento enable row level security;

create policy "envios_seguimiento_all" on envios_seguimiento
  for all using (auth.role() = 'authenticated');
