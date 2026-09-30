# Diccionario Skill

Fuente canónica para crear, modificar e interpretar `DiccionarioDatos.yaml`.

Versión actual: skill 2.0.0 / format_version 2.

Archivos:

- `SKILL.md`: instrucciones operativas para agentes.
- `ESPECIFICACION_DICCIONARIO.md`: contrato del formato.
- `USO_EN_PROYECTOS.md`: cómo incorporar el sistema a un proyecto, explicado por roles.
- `PUESTA_EN_MARCHA.md`: guía paso a paso para la persona, con los requisitos de la carpeta compartida y los mensajes para copiar y pegar.
- `VERSION`: versión de skill y formato soportado.

La misma skill debe ser utilizada por el asistente de diseño (por ejemplo, ChatGPT web o cualquier otro asistente conversacional con acceso al archivo) y el agente de programación (por ejemplo, Codex o cualquier otro agente con acceso al código del proyecto). No mantener copias divergentes de la especificación.

Para un proyecto nuevo:

1. Instalar o referenciar esta skill.
2. Definir para cada proyecto la ubicación compartida de `DiccionarioDatos.yaml` y registrarla en `Docs/DICCIONARIO.md`; en el flujo actual, normalmente será una carpeta de Google Drive sincronizada localmente. Ver "Dónde vive el archivo maestro" en `USO_EN_PROYECTOS.md`.
3. En el asistente de diseño, usar Modo Diseñador para crearlo o modificarlo.
4. En el agente de programación, usar Modo Implementador para consumirlo.
5. Toda modificación del maestro debe seguir lock + backup + historial + guardado seguro.
