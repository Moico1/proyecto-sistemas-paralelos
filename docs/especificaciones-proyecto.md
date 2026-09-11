# Especificaciones del Sistema Mar-Yen

## Contexto académico

- Materia: Sistemas Paralelos.
- Arquitectura: SysLab 2.0.
- Stack: Docker Compose, Node.js, Express, Prisma ORM y PostgreSQL.
- Interfaz: navegador de recepción, cliente y administración.

## Objetivo

Construir una plataforma para gestionar clientes, membresías, pagos, asistencia y comunicación del gimnasio Mar-Yen desde una tablet de recepción y un panel administrativo.

## Arquitectura

```text
Navegador / celular / tablet
          |
          v
Frontend Express + HTML/CSS/JavaScript :5174
          |
          v
Backend Express + Prisma :3000
          |
          v
PostgreSQL 15 :5432
```

Los servicios comparten la red Docker `syslab_network`. El backend utiliza Prisma para toda operación de persistencia.

## Roles y aislamiento

### RECEPCION / TABLET

- Cuenta demo: `tablet_recep1`.
- Valida clientes por C.I.
- Registra cada intento en `Asistencia`.
- Muestra nombre, estado de membresía y días restantes.
- No expone pagos, quejas ni información administrativa.
- Está pensada para operar en modo de pantalla de acceso.

### CLIENTE

- Consulta su tarjeta virtual por C.I.
- Consulta estado y vencimiento de membresía.
- Visualiza productos y suplementos.
- Registra pagos por QR o efectivo.
- Envía comprobantes mediante URL o nombre de archivo.
- Envía quejas o sugerencias.

### ADMIN

- Consulta resumen de usuarios, pagos, quejas y asistencias.
- Aprueba o rechaza pagos.
- Atiende quejas.
- Crea productos del catálogo.
- Publica avisos para clientes.
- Activa usuarios después de aprobar un pago.

## Modelo de datos

- `Usuario`: C.I., nombre, apellido, email, usuario, contraseña demo, rol y estado.
- `Membresia`: usuario, fecha de inicio, fecha de fin y estado.
- `Asistencia`: usuario, fecha/hora y resultado permitido/denegado.
- `Pago`: membresía, método QR/EFECTIVO, comprobante, estado y fecha de aprobación.
- `Producto`: nombre, descripción, precio, stock, imagen y estado activo.
- `Publicacion`: título, contenido y visibilidad.
- `Queja`: cliente, mensaje, estado y fecha.

## Reglas de acceso

1. Un acceso solo se permite si el usuario está `ACTIVO`.
2. La membresía debe estar `ACTIVA` y tener fecha final futura.
3. Todo intento válido o inválido se registra en `Asistencia`.
4. Un C.I. inexistente responde `404`.
5. Una membresía vencida o pago pendiente responde `403`.
6. El panel admin requiere credenciales de administrador.
7. Las credenciales incluidas son únicamente para demostración académica; en producción deben almacenarse con hash y variables secretas.

## Datos de demostración

- Admin: `admin` / `admin123`.
- Recepción: `tablet_recep1` / `tablet123`.
- Cliente activo: C.I. `8888888`.
- Cliente vencido: C.I. `9999999`.

## Endpoints principales

- `POST /api/auth/login`
- `POST /api/asistencia/validar`
- `GET /api/cliente/:ci`
- `GET /api/publico`
- `POST /api/pagos`
- `POST /api/quejas`
- `GET /api/admin/resumen`
- `PATCH /api/admin/pagos/:id`
- `PATCH /api/admin/quejas/:id`
- `POST /api/admin/productos`
- `POST /api/admin/publicaciones`
- `PATCH /api/admin/usuarios/:id/estado`

## Despliegue

```bash
docker compose up --build -d
docker compose exec backend npx prisma db push --accept-data-loss
docker compose exec backend npm run prisma:seed
```

- Web local: `http://localhost:5174`.
- API: `http://localhost:3000`.
- Desde un celular en la misma Wi-Fi: `http://IP_DE_LA_PC:5174`.

## Evidencias sugeridas

1. Árbol de carpetas con `tree`.
2. `schema.prisma` y `git log --oneline`.
3. Explorador mostrando `agente/rules.md` y `agente/skills/`.
4. `docker compose ps` con `db`, `backend` y `frontend` activos.
5. Salida de `prisma db push` y `npm run prisma:seed`.
6. README renderizado y enlace del repositorio.

## Trabajo futuro

- Sustituir contraseñas demo por hash y sesiones/JWT.
- Implementar carga real de archivos para comprobantes.
- Crear migración Prisma formal después de corregir permisos del directorio local.
- Agregar pruebas automatizadas de integración y control de roles en cada endpoint.
