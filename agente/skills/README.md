# Skills

Los `skills` son módulos pequeños y enfocados que realizan acciones concretas: validar datos, interactuar con la base de datos, enviar notificaciones o ejecutar transformaciones.

Convenciones básicas:
- Cada skill tiene un archivo de metadatos `skill.json`.
- La documentación y cualquier implementacion específica van dentro de la carpeta del skill.
- Mantén los skills idempotentes y con efectos bien documentados.

Ejemplos incluidos:
- `core/` : reglas y notas para el backend.
- `tasteskill/` : skill para pruebas de despliegue.

Módulos incluidos (ejemplos): auth, validation, persistence, notifier, logger, permissions, sanitizer, exporter, importer, reporting, metrics, cache, scheduler, email, webhook.

Los módulos de ejemplo están en `agente/skills/modules/`.
