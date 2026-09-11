# 🏋️‍♂️ Proyecto: Sistema de Gestión de Gimnasio "Mar-Yen"

**Materia:** Sistemas Paralelos  
**Docente:** Ing. Elias Cassal Baldiviezo  
**Integrante:** Moises Benjamin Vasquez Condori  
**Arquitectura:** SysLab 2.0 (Docker Compose, PostgreSQL, Prisma ORM, Node.js)

---

## 📋 Descripción del Sistema
Plataforma web para la administración del gimnasio Mar-Yen. El sistema gestiona membresías multimes, automatiza alertas de vencimiento, valida accesos en recepción mediante pases digitales (QR/ID) y controla la asignación de rutinas (generales vs. personalizadas).

---

## 🛠️ Requerimientos del Sistema

### Requerimientos Funcionales (RF)
* **RF-01 (Membresías y Alertas):** Registro de clientes y planes con seguimiento diario del avance y emisión de alertas de cobro al cumplir el periodo.
* **RF-02 (Pase Digital de Recepción):** Verificación instantánea en recepción mostrando estado del cliente (Verde: Activo / Rojo: Vencido) y días transcurridos.
* **RF-03 (Rutinas):** Módulo de rutinas generales incluidas e integración de rutinas personalizadas de pago adicional.
* **RF-04 (Procesamiento Concurrente):** Procesamiento de peticiones concurrentes para validación de asistencia y notificaciones de pago.

---

## 🚀 Despliegue con Docker
```bash
docker compose up --build -d
docker compose exec backend npx prisma db push --accept-data-loss
docker compose exec backend npm run prisma:seed
```

La interfaz queda disponible en `http://localhost:5174` y la API en `http://localhost:3000`.
Desde un celular conectado a la misma Wi-Fi usa la IP local de la computadora, por ejemplo `http://192.168.1.11:5174`.

## 🖥️ Vistas funcionales

- **Recepción / Tablet:** valida C.I., registra asistencia y muestra acceso verde o rojo con días restantes.
- **Cliente:** consulta tarjeta virtual, catálogo, registra comprobante por QR/efectivo y envía quejas.
- **Administración:** inicia sesión, aprueba pagos, atiende quejas, crea productos y publica avisos.
- **Imágenes y QR:** administración puede seleccionar una imagen desde PC/celular para productos y guardar el QR de cobro; el navegador la envía como imagen embebida.
- **Inventario:** cada producto puede retirarse del catálogo; esto lo marca inactivo y coloca su stock en cero sin borrar el historial.
- **Registro rápido:** recepción puede crear clientes pendientes desde la misma pantalla.

Credenciales de demostración:

- Admin: `admin` / `admin123`.
- Tablet: `tablet_recep1` / `tablet123`.
- Cliente: C.I. `8888888` (activo) o `9999999` (vencido).

## 🔌 API principal

- `POST /api/asistencia/validar`
- `POST /api/auth/login`
- `GET /api/cliente/:ci`
- `GET /api/publico`
- `POST /api/pagos`
- `POST /api/quejas`
- `GET /api/admin/resumen`
- `PATCH /api/admin/pagos/:id`
- `POST /api/admin/productos`
- `POST /api/admin/publicaciones`

Puedes comprobar la API con:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/asistencia/validar \
  -H 'Content-Type: application/json' \
  -d '{"ci":"8888888"}'
```

Los datos de prueba son `8888888` (membresía activa) y `9999999` (membresía vencida).

> En desarrollo se usa `prisma db push` porque la carpeta de migraciones heredada tiene permisos de otro usuario en algunos equipos Linux. En una instalación limpia se recomienda corregir esos permisos y generar una migración formal antes de producción.

Si Docker conserva un volumen de `node_modules` anterior después de actualizar Prisma, regenera el cliente con:

```bash
docker compose exec backend npx prisma generate
docker compose restart backend
```
