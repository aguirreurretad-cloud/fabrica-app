-- =============================================
-- Módulo: Fabricación
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

create table if not exists recetas (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  descripcion text,
  unidad_producida text default 'unidad',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists receta_ingredientes (
  id uuid default uuid_generate_v4() primary key,
  receta_id uuid references recetas(id) on delete cascade,
  descripcion text not null,
  cantidad numeric(12,3) not null default 1,
  unidad text,
  costo_unitario numeric(12,2) not null default 0
);

create table if not exists producciones (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  receta_id uuid references recetas(id),
  cantidad_objetivo integer not null default 1,
  cantidad_producida integer not null default 0,
  estado text not null default 'en_proceso'
    check (estado in ('en_proceso', 'pausado', 'completado', 'cancelado')),
  fecha_inicio date default current_date,
  fecha_fin date,
  notas text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger set_updated_at_producciones
  before update on producciones for each row execute procedure update_updated_at();

alter table recetas enable row level security;
alter table receta_ingredientes enable row level security;
alter table producciones enable row level security;

create policy "recetas_all" on recetas for all using (auth.role() = 'authenticated');
create policy "receta_ingredientes_all" on receta_ingredientes for all using (auth.role() = 'authenticated');
create policy "producciones_all" on producciones for all using (auth.role() = 'authenticated');
