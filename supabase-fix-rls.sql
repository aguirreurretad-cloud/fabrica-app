-- =============================================
-- FIX 409: Políticas RLS para presupuestos
-- Ejecutar en Supabase → SQL Editor → New query
-- =============================================

-- Eliminar políticas existentes que pueden estar bloqueando
DROP POLICY IF EXISTS "presupuestos_all" ON presupuestos;
DROP POLICY IF EXISTS "presupuesto_items_all" ON presupuesto_items;
DROP POLICY IF EXISTS "pedidos_all" ON pedidos;
DROP POLICY IF EXISTS "pedido_items_all" ON pedido_items;
DROP POLICY IF EXISTS "movimientos_all" ON movimientos;
DROP POLICY IF EXISTS "clientes_all" ON clientes;
DROP POLICY IF EXISTS "productos_all" ON productos;
DROP POLICY IF EXISTS "variantes_all" ON producto_variantes;
DROP POLICY IF EXISTS "categorias_all" ON categorias;

-- Recrear con permisos explícitos por operación
-- PRESUPUESTOS
CREATE POLICY "presupuestos_select" ON presupuestos FOR SELECT TO authenticated USING (true);
CREATE POLICY "presupuestos_insert" ON presupuestos FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "presupuestos_update" ON presupuestos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "presupuestos_delete" ON presupuestos FOR DELETE TO authenticated USING (true);

-- PRESUPUESTO ITEMS
CREATE POLICY "presupuesto_items_select" ON presupuesto_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "presupuesto_items_insert" ON presupuesto_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "presupuesto_items_update" ON presupuesto_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "presupuesto_items_delete" ON presupuesto_items FOR DELETE TO authenticated USING (true);

-- PEDIDOS
CREATE POLICY "pedidos_select" ON pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "pedidos_delete" ON pedidos FOR DELETE TO authenticated USING (true);

-- PEDIDO ITEMS
CREATE POLICY "pedido_items_select" ON pedido_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "pedido_items_insert" ON pedido_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pedido_items_update" ON pedido_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "pedido_items_delete" ON pedido_items FOR DELETE TO authenticated USING (true);

-- MOVIMIENTOS
CREATE POLICY "movimientos_select" ON movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimientos_insert" ON movimientos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "movimientos_update" ON movimientos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "movimientos_delete" ON movimientos FOR DELETE TO authenticated USING (true);

-- CLIENTES
CREATE POLICY "clientes_select" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_insert" ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clientes_update" ON clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clientes_delete" ON clientes FOR DELETE TO authenticated USING (true);

-- PRODUCTOS
CREATE POLICY "productos_select" ON productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "productos_insert" ON productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "productos_update" ON productos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "productos_delete" ON productos FOR DELETE TO authenticated USING (true);

-- VARIANTES
CREATE POLICY "variantes_select" ON producto_variantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "variantes_insert" ON producto_variantes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "variantes_update" ON producto_variantes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "variantes_delete" ON producto_variantes FOR DELETE TO authenticated USING (true);

-- CATEGORIAS
CREATE POLICY "categorias_select" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "categorias_insert" ON categorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "categorias_update" ON categorias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "categorias_delete" ON categorias FOR DELETE TO authenticated USING (true);

-- Verificar que el profile del usuario existe
-- (si falta, el created_by falla por FK)
INSERT INTO profiles (id, email, nombre, rol)
SELECT
  u.id,
  u.email,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'nombre'), ''), SPLIT_PART(u.email, '@', 1), 'Usuario'),
  'admin'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

SELECT 'Fix aplicado. Políticas RLS actualizadas.' AS resultado;
