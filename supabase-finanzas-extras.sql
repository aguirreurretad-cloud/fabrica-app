-- Costos fijos y calculadora de factura
-- Ejecutar en: Supabase → SQL Editor → New query

create table if not exists costos_fijos (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  monto numeric(12,2) not null default 0,
  frecuencia text not null default 'mensual'
    check (frecuencia in ('mensual', 'trimestral', 'anual')),
  activo boolean not null default true,
  created_at timestamptz default now()
);

alter table costos_fijos enable row level security;
create policy "costos_fijos_all" on costos_fijos for all using (auth.role() = 'authenticated');

create table if not exists facturas_calculo (
  id uuid default uuid_generate_v4() primary key,
  descripcion text not null,
  monto_base numeric(12,2) not null,
  porcentaje numeric(5,2) not null default 4,
  monto_final numeric(12,2) not null,
  fecha date not null default current_date,
  created_at timestamptz default now()
);

alter table facturas_calculo enable row level security;
create policy "facturas_calculo_all" on facturas_calculo for all using (auth.role() = 'authenticated');
