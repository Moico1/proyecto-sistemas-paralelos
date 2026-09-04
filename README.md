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
docker compose up -d
docker compose exec backend npx prisma migrate dev
docker compose exec backend node prisma/seed.js
