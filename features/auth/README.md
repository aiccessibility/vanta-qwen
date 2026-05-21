# Vanta Authentication System

## Overview

El sistema de autenticación de Vanta está construido con **Supabase Auth** y sigue las mejores prácticas de seguridad para aplicaciones Next.js.

## Arquitectura

### Provider
- **Supabase Auth**: Maneja el registro, login, y gestión de sesiones

### Session Strategy
- **Secure Cookies**: Las sesiones se almacenan en cookies HTTP-only para mayor seguridad
- **Middleware Protection**: Rutas protegidas mediante middleware de Next.js
- **Server Components Compatible**: Totalmente compatible con React Server Components

### Roles
- **owner**: Propietario de la organización (máximos permisos)
- **admin**: Administrador con permisos elevados
- **member**: Miembro estándar con permisos básicos

## Estructura de Archivos

```
features/auth/
├── lib/
│   └── supabase-auth.ts      # Funciones principales de autenticación
├── components/
│   └── auth-provider.tsx     # Contexto de autenticación
├── hooks/
│   ├── use-login.ts          # Hook para login
│   ├── use-signup.ts         # Hook para registro
│   └── use-logout.ts         # Hook para logout
└── index.ts                  # Exportaciones públicas

lib/validators/
└── auth.ts                   # Validaciones de formularios con Zod

app/
├── login/page.tsx            # Página de login
├── signup/page.tsx           # Página de registro
├── api/auth/callback/        # Callback de OAuth
└── auth/callback/            # Página de callback
```

## Configuración

### Variables de Entorno

Asegúrate de configurar las siguientes variables en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Base de Datos

Ejecuta la migración inicial en Supabase:

```bash
# En el dashboard de Supabase, ejecuta el SQL de:
# supabase/migrations/001_initial_auth_schema.sql
```

La migración crea:
- Tabla `profiles` (extiende auth.users)
- Tabla `organizations`
- Tabla `organization_members`
- Triggers automáticos para creación de perfiles y organizaciones
- Políticas de Row Level Security (RLS)

## Uso

### Login

```tsx
import { useLogin } from '@/features/auth'

function LoginForm() {
  const { isLoading, error, login } = useLogin()
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login({ email, password })
  }
  
  // ... resto del componente
}
```

### Registro

```tsx
import { useSignup } from '@/features/auth'

function SignupForm() {
  const { isLoading, error, signup } = useSignup()
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await signup({ name, email, password })
  }
  
  // ... resto del componente
}
```

### Logout

```tsx
import { useLogout } from '@/features/auth'

function Header() {
  const { logout } = useLogout()
  
  return <button onClick={logout}>Cerrar sesión</button>
}
```

### Obtener Usuario Autenticado

#### En Server Components

```tsx
import { getCurrentUser } from '@/features/auth/lib/supabase-auth'

async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <div>Hola, {user.name}</div>
}
```

#### En Client Components

```tsx
'use client'

import { useAuth } from '@/features/auth'

function UserProfile() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <Cargando... />
  if (!isAuthenticated) return <NoAutorizado />
  
  return <div>{user.name}</div>
}
```

## Rutas Protegidas

El middleware protege automáticamente las siguientes rutas:
- `/dashboard`
- `/transactions`
- `/taxes`
- `/documents`
- `/assistant`
- `/settings`
- `/onboarding`

Los usuarios no autenticados son redirigidos a `/login`.

## Control de Acceso por Roles

- `/settings`: Solo accesible para roles `owner` y `admin`
- Otras rutas: Accesibles para todos los roles autenticados

## Seguridad

### Cookies
- `sb-access-token`: Token de acceso (httpOnly, secure en producción)
- `sb-refresh-token`: Token de refresco (httpOnly, secure en producción)

### Row Level Security (RLS)
Todas las tablas tienen políticas RLS que garantizan que los usuarios solo puedan acceder a sus propios datos o datos de su organización.

## Flujo de Autenticación

1. **Registro**: 
   - Usuario completa formulario → `useSignup` → `signUp` → Crea perfil y organización automáticamente
   
2. **Login**: 
   - Usuario ingresa credenciales → `useLogin` → `signIn` → Establece cookies → Redirige al dashboard
   
3. **Callback OAuth**: 
   - Supabase redirige a `/api/auth/callback` → Intercambia código por sesión → Establece cookies → Redirige

4. **Logout**: 
   - `useLogout` → `signOut` → Limpia cookies → Redirige a `/login`

## Próximos Pasos

- [ ] Implementar recuperación de contraseña
- [ ] Agregar verificación de email
- [ ] Implementar autenticación social (Google, GitHub)
- [ ] Agregar 2FA (Two-Factor Authentication)
- [ ] Implementar invitación de miembros a organizaciones
