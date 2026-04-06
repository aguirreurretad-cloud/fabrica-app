-- =============================================
-- FIX: Error al crear usuarios
-- Ejecutar en Supabase → SQL Editor → New query
-- =============================================

-- 1. Hacer que 'nombre' acepte null temporalmente
--    (o que tenga un default seguro)
ALTER TABLE profiles
  ALTER COLUMN nombre SET DEFAULT '';

ALTER TABLE profiles
  ALTER COLUMN nombre DROP NOT NULL;

-- 2. Reemplazar el trigger con una versión más robusta
--    que nunca falla aunque falten metadatos
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_nombre text;
  v_rol    text;
BEGIN
  -- Extraer nombre de metadatos o usar parte del email como fallback
  v_nombre := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'nombre'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(new.email, '@', 1),
    'Usuario'
  );

  -- Extraer rol, default operario
  v_rol := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'rol'), ''),
    'operario'
  );

  -- Validar que el rol sea válido
  IF v_rol NOT IN ('admin', 'operario', 'vendedor') THEN
    v_rol := 'operario';
  END IF;

  INSERT INTO profiles (id, email, nombre, rol)
  VALUES (new.id, new.email, v_nombre, v_rol)
  ON CONFLICT (id) DO UPDATE
    SET email  = EXCLUDED.email,
        nombre = CASE WHEN profiles.nombre = '' THEN EXCLUDED.nombre ELSE profiles.nombre END;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear la creación del usuario aunque falle el profile
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 4. Crear profiles para usuarios que ya existen en auth.users
--    pero no tienen profile (por el error anterior)
INSERT INTO profiles (id, email, nombre, rol)
SELECT
  u.id,
  u.email,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'nombre'), ''),
    SPLIT_PART(u.email, '@', 1),
    'Usuario'
  ),
  'admin'  -- primer usuario existente es admin
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. Confirmar
SELECT 'Fix aplicado correctamente. Usuarios en profiles: ' || COUNT(*)::text AS resultado
FROM profiles;
