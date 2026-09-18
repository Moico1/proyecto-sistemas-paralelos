# Runtime de Workflows (ejecución mínima)

Este runtime carga YAML de `agente/workflows/`, evalúa `rules/` y ejecuta handlers simples en `agente/runtime/skills`.

Uso rápido:

1. Instalar dependencias:

```bash
cd agente/runtime
npm install
```

2. Ejecutar el ejemplo:

```bash
node index.js
```

Los datos persistidos por la demo se almacenan en `agente/runtime/data/asistencia.json`.
