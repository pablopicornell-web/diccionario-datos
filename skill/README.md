# Diccionario Skill

Fuente canónica para crear, modificar e interpretar `DiccionarioDatos.yaml`.

Versión actual: skill 2.0.0 / format_version 2.

Archivos:

- `SKILL.md`: instrucciones operativas para agentes.
- `ESPECIFICACION_DICCIONARIO.md`: contrato del formato.
- `VERSION`: versión de skill y formato soportado.

La misma skill debe ser utilizada por ChatGPT y Codex. No mantener copias divergentes de la especificación.

Para un proyecto nuevo:

1. Instalar o referenciar esta skill.
2. Definir para cada proyecto la ubicación compartida de `DiccionarioDatos.yaml` y registrarla en `Docs/DICCIONARIO.md`; en el flujo actual, normalmente será una carpeta de Google Drive sincronizada localmente. Ver "Dónde vive el archivo maestro" en `USO_EN_PROYECTOS.md`.
3. En ChatGPT, usar Modo Diseñador para crearlo o modificarlo.
4. En Codex, usar Modo Implementador para consumirlo.
5. Toda modificación del maestro debe seguir lock + backup + historial + guardado seguro.
