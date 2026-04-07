-- Tracking de pagos mensuales de costos fijos
-- Ejecutar en: Supabase → SQL Editor → New query

create table if not exists costos_fijos_pagos (
  id uuid default uuid_generate_v4() primary key,
  costo_fijo_id uuid references costos_fijos(id) on delete cascade,
  mes text not null, -- formato "2026-04"
  created_at timestamptz default now(),
  unique(costo_fijo_id, mes)
);

alter table costos_fijos_pagos enable row level security;
create policy "costos_fijos_pagos_all" on costos_fijos_pagos for all using (auth.role() = 'authenticated');
