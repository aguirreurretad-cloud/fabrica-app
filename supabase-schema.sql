-- =============================================
-- FABRICA APP - Schema completo para Supabase
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLA: profiles (usuarios del sistema)
-- =============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nombre text not null,
  rol text not null default 'operario' check (rol in ('admin', 'operario', 'vendedor')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Trigger para crear profile automáticamente al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'rol', 'operario')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================
-- TABLA: categorias
-- =============================================
create table if not exists categorias (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  descripcion text
);

-- Categorías iniciales para una fábrica textil
insert into categorias (nombre) values
  ('Remeras'),
  ('Buzos'),
  ('Pantalones'),
  ('Camisas'),
  ('Vestidos'),
  ('Camperas'),
  ('Ropa interior'),
  ('Accesorios')
on conflict do nothing;

-- =============================================
-- TABLA: clientes
-- =============================================
create table if not exists clientes (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  cuit text,
  email text,
  telefono text,
  direccion text,
  ciudad text,
  provincia text,
  tipo text not null default 'minorista' check (tipo in ('mayorista', 'minorista', 'ocasional')),
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- TABLA: productos
-- =============================================
create table if not exists productos (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  descripcion text,
  categoria_id uuid references categorias(id),
  precio_venta numeric(12,2) not null default 0,
  precio_costo numeric(12,2) default 0,
  foto_url text,
  activo boolean default true,
  stock_minimo integer default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- TABLA: producto_variantes (tallas/colores)
-- =============================================
create table if not exists producto_variantes (
  id uuid default uuid_generate_v4() primary key,
  producto_id uuid references productos(id) on delete cascade,
  talla text,
  color text,
  stock integer not null default 0,
  sku text
);

-- =============================================
-- TABLA: presupuestos
-- =============================================
create table if not exists presupuestos (
  id uuid default uuid_generate_v4() primary key,
  numero serial,
  cliente_id uuid references clientes(id),
  estado text not null default 'borrador'
    check (estado in ('borrador', 'enviado', 'aprobado', 'rechazado')),
  subtotal numeric(12,2) not null default 0,
  descuento numeric(5,2) not null default 0,
  iva numeric(5,2) not null default 21,
  total numeric(12,2) not null default 0,
  notas text,
  validez_dias integer default 15,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- TABLA: presupuesto_items
-- =============================================
create table if not exists presupuesto_items (
  id uuid default uuid_generate_v4() primary key,
  presupuesto_id uuid references presupuestos(id) on delete cascade,
  producto_id uuid references productos(id),
  descripcion text not null,
  cantidad integer not null default 1,
  precio_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

-- =============================================
-- TABLA: pedidos
-- =============================================
create table if not exists pedidos (
  id uuid default uuid_generate_v4() primary key,
  numero serial,
  cliente_id uuid references clientes(id),
  presupuesto_id uuid references presupuestos(id),
  estado text not null default 'recibido'
    check (estado in ('recibido', 'en_produccion', 'listo', 'enviado', 'entregado')),
  total numeric(12,2) not null default 0,
  fecha_entrega date,
  notas text,
  asignado_a uuid references profiles(id),
  tracking_number text,
  tracking_estado text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- TABLA: pedido_items
-- =============================================
create table if not exists pedido_items (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references pedidos(id) on delete cascade,
  producto_id uuid references productos(id),
  variante_id uuid references producto_variantes(id),
  descripcion text not null,
  cantidad integer not null default 1,
  precio_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

-- =============================================
-- TABLA: movimientos (finanzas)
-- =============================================
create table if not exists movimientos (
  id uuid default uuid_generate_v4() primary key,
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  descripcion text not null,
  monto numeric(12,2) not null,
  categoria text,
  pedido_id uuid references pedidos(id),
  cliente_id uuid references clientes(id),
  fecha date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- =============================================
-- TRIGGERS: updated_at automático
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_clientes
  before update on clientes for each row execute procedure update_updated_at();
create trigger set_updated_at_productos
  before update on productos for each row execute procedure update_updated_at();
create trigger set_updated_at_presupuestos
  before update on presupuestos for each row execute procedure update_updated_at();
create trigger set_updated_at_pedidos
  before update on pedidos for each row execute procedure update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
alter table profiles enable row level security;
alter table clientes enable row level security;
alter table categorias enable row level security;
alter table productos enable row level security;
alter table producto_variantes enable row level security;
alter table presupuestos enable row level security;
alter table presupuesto_items enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table movimientos enable row level security;

-- Profiles: cada uno ve el suyo, admin ve todos
create policy "profiles_select" on profiles for select
  using (auth.uid() = id or exists(
    select 1 from profiles p where p.id = auth.uid() and p.rol = 'admin'
  ));
create policy "profiles_update" on profiles for update
  using (auth.uid() = id);

-- Resto de tablas: cualquier usuario autenticado puede operar
-- (en producción podés refinar por rol)
create policy "clientes_all" on clientes for all using (auth.role() = 'authenticated');
create policy "categorias_all" on categorias for all using (auth.role() = 'authenticated');
create policy "productos_all" on productos for all using (auth.role() = 'authenticated');
create policy "variantes_all" on producto_variantes for all using (auth.role() = 'authenticated');
create policy "presupuestos_all" on presupuestos for all using (auth.role() = 'authenticated');
create policy "presupuesto_items_all" on presupuesto_items for all using (auth.role() = 'authenticated');
create policy "pedidos_all" on pedidos for all using (auth.role() = 'authenticated');
create policy "pedido_items_all" on pedido_items for all using (auth.role() = 'authenticated');
create policy "movimientos_all" on movimientos for all using (auth.role() = 'authenticated');

-- =============================================
-- STORAGE: bucket para fotos de productos
-- =============================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict do nothing;

create policy "productos_storage_select" on storage.objects
  for select using (bucket_id = 'productos');
create policy "productos_storage_insert" on storage.objects
  for insert with check (bucket_id = 'productos' and auth.role() = 'authenticated');
create policy "productos_storage_delete" on storage.objects
  for delete using (bucket_id = 'productos' and auth.role() = 'authenticated');
