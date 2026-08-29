# 🚀 Proyecto de Sistemas Paralelos — SysLab 2.0[cite: 1]

> **Integrantes del Grupo:**[cite: 1]
> * Moises Benjamin Vasquez Condori[cite: 1]
>
> **Docente:** Ing. Elias Cassal Baldiviezo[cite: 1]
> **Materia:** Sistemas Paralelos[cite: 1]
> **Arquitectura Base:** SysLab 2.0[cite: 1]

---

## 📌 1. Descripción del Proyecto[cite: 1]
Despliegue y configuración de un entorno de desarrollo multi-contenedor utilizando Docker Compose, compuesto por servicios de Backend (Node.js/Express), Frontend y una base de datos PostgreSQL mapeada mediante Prisma ORM, junto a la integración de reglas de comportamiento para agentes de IA alineados a la arquitectura SysLab 2.0.

---

## 🛠️ 2. Arquitectura de Tecnologías (SysLab 2.0)[cite: 1]
El proyecto está diseñado sobre la arquitectura **SysLab 2.0**, distribuyendo responsabilidades en tres capas principales orquestadas mediante contenedores Docker:[cite: 1]
* **Frontend:** Node.js con entorno de desarrollo responsivo.[cite: 1]
* **Backend:** Node.js — API / Servidor de aplicaciones.[cite: 1]
* **Persistencia / Base de Datos:** PostgreSQL con **Prisma ORM** como mapeador objeto-relacional.[cite: 1]
* **Agente de IA:** Reglas (`rules`) y habilidades (`skills`) personalizadas integradas desde TasteSkill.[cite: 1]

---

## 📁 3. Estructura del Repositorio[cite: 1]
```text
.
├── agente/                # Skills e instrucciones del agente de IA
│   ├── skills/            # Skills importadas de TasteSkill y custom SysLab 2.0
│   └── rules.md           # Reglas de comportamiento del agente
├── backend/               # Código fuente del Backend
│   ├── prisma/            # Configuración de persistencia
│   │   ├── schema.prisma  # Modelo de datos Prisma
│   │   └── seed.js        # Script de datos iniciales
│   ├── Dockerfile         # Imagen Docker del Backend
│   └── package.json
├── frontend/              # Código fuente del Frontend
│   ├── Dockerfile         # Imagen Docker del Frontend
│   └── package.json
├── docker-compose.yml     # Orquestación de contenedores (Frontend, Backend, DB)
└── README.md              # Documentación general del proyecto
