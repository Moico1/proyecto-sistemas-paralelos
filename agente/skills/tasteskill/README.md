# TasteSkill / SysLab

Skill local para la practica de despliegue multi-contenedor.

## Flujo

1. Construir con `docker compose build`.
2. Levantar PostgreSQL, backend y frontend con `docker compose up -d`.
3. Sincronizar Prisma con `docker compose exec backend npx prisma db push --accept-data-loss` cuando se trabaje en desarrollo.
4. Ejecutar `docker compose exec backend npm run prisma:seed`.
5. Verificar `/health`, la pantalla de recepcion y los paneles de cliente/admin.

Las credenciales de demostracion se documentan en el README del proyecto y no deben reutilizarse en produccion.
