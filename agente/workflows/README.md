# Workflows

Los `workflows` describen orquestaciones de alto nivel: secuencias de `skills` aplicadas a entradas, condicionadas por `rules`.

Convenciones:
- Cada workflow es un archivo YAML con `name`, `description`, y `steps`.
- Cada paso referencia un `skill` y puede declarar `on_success` y `on_failure`.

Ejemplo incluido: `asistencia_workflow.yaml`.
