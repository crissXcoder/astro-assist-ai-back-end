# AstroAssist AI Backend

Este es el backend de AstroAssist AI, construido con [NestJS](https://nestjs.com/) y TypeScript bajo un estándar de Clean Architecture y seguridad estricta.

## 📁 Estructura del Proyecto

```text
astro-assist-ai-back-end/
├── src/
│   ├── common/         # Filtros, Pipes, Guards globales
│   ├── config/         # Configuración y validación de variables de entorno
│   ├── database/       # Configuración TypeORM y Migraciones
│   └── modules/        # Módulos de la aplicación
│       ├── auth/       # Autenticación (Login, Registro, JWT)
│       ├── users/      # Gestión de usuarios y perfiles
│       ├── sessions/   # Gestión de sesiones (Stub)
│       ├── audit/      # Auditoría y logs de sistema (Stub)
│       └── health/     # Health check
```

## ⚙️ Variables de Entorno

Copie el archivo `.env.example` a `.env` y configure las variables de entorno necesarias:

```bash
cp .env.example .env
```

Variables principales a configurar:
- `PORT`: Puerto en el que corre la API (default: 3001)
- `DB_*`: Credenciales de conexión a MySQL.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Claves secretas para firmar los tokens.
- `FRONTEND_URL`: URL del frontend (ej. `http://localhost:3000`) para configuración de CORS.
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`: Credenciales del usuario administrador inicial.

## 🚀 Instalación

```bash
# Instalar dependencias
npm install
```

## 🛠️ Comandos

```bash
# Iniciar en modo desarrollo
npm run start:dev

# Compilar para producción
npm run build

# Iniciar en producción
npm run start:prod

# Ejecutar linters
npm run lint

# Migraciones de base de datos
npm run migration:generate -- src/database/migrations/NombreMigracion
npm run migration:run
```

## 🩺 Health Check

El proyecto incluye un endpoint de verificación de salud para monitorizar el estado de la API.
Se puede probar haciendo una petición HTTP GET:

**Endpoint:** `GET /health`

**Respuesta Exitosa (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T00:00:00.000Z",
  "uptime": 123.45
}
```
