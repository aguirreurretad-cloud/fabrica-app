# FabricApp — Sistema de gestión textil

App web completa para gestionar tu fábrica: presupuestos, productos, clientes, pedidos, seguimiento de Correo Argentino y finanzas.

---

## 🚀 Cómo levantar la app (paso a paso)

### Paso 1 — Instalar Node.js

1. Entrá a [nodejs.org](https://nodejs.org)
2. Descargá la versión **LTS** e instalá normalmente
3. Para verificar, abrí la terminal y escribí: `node --version`

### Paso 2 — Crear tu proyecto en Supabase (base de datos gratis)

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta gratis
2. Hacé clic en **New project**
3. Poné un nombre (ej: "fabrica-app") y una contraseña
4. Esperá 1-2 minutos a que se cree

### Paso 3 — Crear las tablas en Supabase

1. En tu proyecto Supabase, andá a **SQL Editor** (ícono de consola en el menú izquierdo)
2. Hacé clic en **New query**
3. Copiá todo el contenido del archivo `supabase-schema.sql` y pegalo
4. Hacé clic en **Run** (o Ctrl+Enter)
5. Deberías ver "Success" en verde

### Paso 4 — Obtener las credenciales de Supabase

1. En tu proyecto Supabase, andá a **Settings** → **API**
2. Copiá:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key (clave larga que empieza con `eyJ...`)

### Paso 5 — Configurar el proyecto

1. Abrí la carpeta del proyecto en tu computadora
2. Encontrá el archivo `.env.example`
3. **Copialo** y renombrá la copia como `.env.local`
4. Abrilo con el Bloc de notas y reemplazá:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```
   con tus datos reales

### Paso 6 — Instalar y correr

Abrí la terminal en la carpeta del proyecto y ejecutá:

```bash
npm install
npm run dev
```

Abrí el navegador en [http://localhost:3000](http://localhost:3000)

### Paso 7 — Crear el primer usuario (admin)

1. En Supabase, andá a **Authentication** → **Users** → **Add user**
2. Completá email y contraseña
3. Ya podés iniciar sesión en la app

---

## 🌐 Publicar en internet (para acceder desde cualquier dispositivo)

### Opción A — Vercel (recomendado, gratis)

1. Creá una cuenta en [vercel.com](https://vercel.com)
2. Instalá Vercel CLI: `npm install -g vercel`
3. En la carpeta del proyecto: `vercel`
4. Seguí las instrucciones (todo con Enter)
5. En el dashboard de Vercel, agregá las variables de entorno (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Redeploy: `vercel --prod`

Tu app va a estar en una URL tipo `fabrica-app.vercel.app` 🎉

### Agregar al celular como app

1. Abrí la URL de tu app en el navegador del celular
2. iOS: tocá el ícono de compartir → "Agregar a pantalla de inicio"
3. Android: menú → "Agregar a pantalla de inicio"

---

## 📁 Estructura del proyecto

```
fabrica-app/
├── app/
│   ├── (app)/               ← Páginas con autenticación
│   │   ├── dashboard/       ← Panel principal
│   │   ├── presupuestos/    ← Módulo presupuestos
│   │   ├── productos/       ← Catálogo con fotos
│   │   ├── clientes/        ← CRM simple
│   │   ├── pedidos/         ← Kanban de producción
│   │   ├── correo/          ← Rastreo Correo Argentino
│   │   └── finanzas/        ← Caja e ingresos
│   ├── api/correo/          ← API de rastreo
│   └── login/               ← Pantalla de ingreso
├── components/
│   ├── ui/                  ← Componentes reutilizables
│   └── layout/              ← Sidebar y topbar
├── lib/supabase/            ← Conexión a base de datos
├── types/                   ← Tipos TypeScript
└── supabase-schema.sql      ← Schema completo de la BD
```

---

## 🔜 Próximas fases

- **Fase 2** — Generación de PDF para presupuestos con tu logo
- **Fase 3** — Nuevo pedido desde presupuesto aprobado
- **Fase 4** — Ficha detallada de cliente con historial completo
- **Fase 5** — Gráficos de finanzas y rentabilidad por producto

---

## ❓ Problemas frecuentes

**"Cannot find module" al correr** → Corré `npm install` de nuevo

**"Invalid API key"** → Verificá que `.env.local` tenga las credenciales correctas de Supabase

**La foto no sube** → Verificá que el bucket "productos" esté creado en Supabase Storage (lo crea el SQL)

**No puedo iniciar sesión** → Creá el usuario desde el panel de Supabase → Authentication → Users

---

Hecho con ❤️ para tu fábrica 🧵
