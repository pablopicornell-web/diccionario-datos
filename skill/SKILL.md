# Skill Diccionario

Versión de skill: 2.0.0  
Formato soportado: DiccionarioDatos format_version 2

## Propósito

Esta skill define cómo crear, revisar, modificar e interpretar un `DiccionarioDatos.yaml`.

El archivo `DiccionarioDatos.yaml` es la fuente de verdad del modelo de datos del proyecto. No debe sustituirse por inferencias del agente ni por una copia paralela.

La ubicación de `DiccionarioDatos.yaml` se define por proyecto.

Cuando ChatGPT web y Codex local deban compartir y modificar el mismo archivo, la ubicación recomendada es una carpeta compartida/sincronizada accesible por ambos; en el flujo actual, normalmente una carpeta de Google Drive sincronizada localmente.

La ruta concreta debe quedar registrada en `Docs/DICCIONARIO.md` o ser indicada explícitamente por el usuario. No asumir `Docs/DiccionarioDatos.yaml` como ruta por defecto. Ver "Dónde vive el archivo maestro" en `USO_EN_PROYECTOS.md`.

La especificación canónica está en:

`skill/ESPECIFICACION_DICCIONARIO.md`

Ante cualquier duda sobre una propiedad, prevalece esa especificación.

## Modos de uso

### Modo Diseñador

Usar cuando se analiza una necesidad funcional y hay que crear o modificar el diccionario.

Responsabilidades:

1. Entender qué información necesita manejar el proyecto.
2. Definir tablas, campos, tipos, longitudes, precisión, relaciones, índices, validaciones simples y metadata visual.
3. Resolver primero las decisiones normales para que el implementador tenga que inferir lo mínimo posible.
4. Preguntar sólo cuando una decisión funcional no pueda deducirse razonablemente.
5. No inventar estructuras complejas sin necesidad.
6. Mantener el YAML canónico, legible y consistente.
7. Respetar el protocolo de lock, backup, historial y guardado seguro antes de modificar un diccionario existente.

Reglas de diseño importantes:

- Un dato lógico tiene una sola definición conceptual y puede tener varias definiciones físicas por motor.
- La longitud lógica de un string representa el máximo funcional del dato.
- PK a nivel tabla; unicidad simple en campo; unicidad compuesta a nivel tabla.
- Listas pequeñas y cerradas: `allowed_values`.
- Valores administrables o compartidos: tabla `lookup` + relación.
- Cantidad fija y pequeña de valores repetidos puede resolverse con campos separados; cantidad variable, con tabla relacionada.
- UI básica e i18n se definen en el diccionario para evitar improvisación posterior.
- En tablas `lookup`, usar `display_fields` como representación visible predeterminada del registro y `default_sort` como criterio de orden independiente.
- Un `lookup` puede permitir alta inmediata mediante `ui.lookup.allow_create: true`; si falta, asumir `false`.
- Un lookup puede declarar `search_modes`, `default_search_mode` y `user_can_switch_mode`; `prefix` es el modo inicial recomendado.
- Si la tabla destino usa `lifecycle.delete_mode: status`, las nuevas selecciones deben excluir el valor marcado por `deleted_value`, pero las referencias históricas existentes deben seguir resolviéndose y mostrándose.
- `display_fields` define representación visible; `default_sort` define orden. No derivar uno del otro automáticamente.
- Evitar índices redundantes cuando una restricción `unique` o `unique_constraints` ya cubre exactamente los mismos campos.
- La auditoría estándar puede modelarse con las semánticas `created_at`, `updated_at`, `created_by` y `updated_by`; es un patrón recomendado, no una obligación universal.
- Un campo puede declarar `auditable: true`; por defecto no debe asumirse que todos los campos son auditables.
- Si el proyecto usa auditoría global, modelarla como una tabla normal `system` explícita en el diccionario, no como infraestructura implícita.
- No incluir lógica general de negocio, permisos por rol, consultas derivadas, migraciones ni datos de prueba dentro del maestro v2.

### Modo Implementador

Usar cuando se desarrolla una aplicación que consume un diccionario existente.

Responsabilidades:

1. Leer el diccionario antes de crear o modificar estructuras de datos.
2. Respetar literalmente las decisiones ya definidas.
3. Usar la definición física del `database.active_engine`.
4. No inventar nombres, tipos, relaciones, longitudes, labels, anchos ni comportamiento CRUD si ya están definidos.
5. Si una necesidad requiere cambiar el modelo, modificar primero el diccionario siguiendo el protocolo; después adaptar el código.
6. No usar elementos `deprecated` para desarrollo nuevo salvo compatibilidad explícita.
7. Tratar el diccionario como contrato, no como sugerencia.

Interpretaciones obligatorias:

- `ui.width`: ancho esperado del control de formulario.
- `ui.column_width`: ancho esperado de columna.
- `ui.column_flexible`: si puede absorber espacio sobrante.
- `ui.align`: alineación.
- `relation`: referencia real; guardar la clave, mostrar la representación formada por `display_fields` de la tabla relacionada.
- En `lookup`, el usuario trabaja con el valor visible; la FK es interna y no se edita como ID.
- `ui.lookup.allow_create: true`: si no hay coincidencia, puede crearse inmediatamente un registro normal de la tabla relacionada; luego se administra desde su mantenimiento habitual.
- Un lookup opcional arranca sin selección y no elige automáticamente el primer registro.
- Por defecto un lookup busca en modo `prefix`; si admite `contains`, el operador puede alternar cuando `user_can_switch_mode: true`. La preferencia dinámica del operador no se guarda en el diccionario.
- Un lookup obligatorio puede tener selección inicial sólo si el proyecto la define; el orden de presentación proviene de `default_sort`/índices, no del ID por defecto.
- `display_fields` es una lista ordenada de hasta 5 campos existentes de la tabla y define la representación visual del registro; `default_sort` define en qué orden se presenta. Son conceptos distintos.
- No generar automáticamente índices a partir de `display_fields`.
- `ui.control: switch` representa un booleano o estado binario como toggle; no reemplaza a `checkbox`.
- `lifecycle.delete_mode`: determina si eliminar es hard, soft o cambio de estado. Un campo usado por lifecycle puede seguir siendo editable si su metadata UI lo permite.
- Para destino con lifecycle por estado, una baja lógica no limpia FK históricas ni impide mostrar registros ya referenciados; sólo los excluye de nuevas selecciones normales.
- `table_role: lookup` + navegación de configuración: mantenimiento secundario, no menú principal.
- `label` multilenguaje: fuente de verdad de textos asociados al modelo.
- Claves i18n: derivarlas de manera determinista; no codificar labels literales.
- Alta y edición reutilizan el mismo formulario.
- Acciones de fila de grilla, cuando correspondan, van en el extremo derecho.
- `schema_version` cambia sólo ante cambios estructurales o semánticos del esquema, no por cambios puramente visuales.

## Protocolo de edición del archivo

Lectura libre. Escritura exclusiva.

Antes de modificar:

1. Comprobar `DiccionarioDatos.lock`.
2. Adquirir lock de escritura.
3. Registrar hash SHA-256 base del maestro.
4. Antes de la primera modificación de la sesión, crear una copia en `historial/`.

Al guardar:

1. Validar.
2. Escribir temporal.
3. Releer y validar el temporal.
4. Verificar que el maestro no cambió externamente respecto del hash base.
5. Reemplazar el maestro de forma segura.
6. Crear el archivo Markdown de historial con el resumen completo de la sesión.
7. Liberar el lock.

No hacer merge automático de cambios concurrentes.

## Historial

Cada sesión de edición genera una pareja:

`NNNNNN_YYYY-MM-DD_HH-MM_origen.yaml`  
`NNNNNN_YYYY-MM-DD_HH-MM_origen.md`

El YAML es el estado previo a la sesión.  
El Markdown resume todos los cambios efectivamente guardados.

Orígenes habituales:

- editor
- chatgpt
- codex
- manual

## Creación de un diccionario nuevo

Para crear uno nuevo, definir como mínimo:

- `format_version`
- `schema_version`
- proyecto
- idioma por defecto e idiomas
- locale
- motor activo y motores declarados
- `tables: []`

Luego completar tablas y campos de acuerdo con la especificación.

## Conflictos y prioridades

- El diccionario manda sobre decisiones de almacenamiento y presentación básica ya definidas.
- La lógica de negocio específica del proyecto manda fuera de ese ámbito.
- Si el diccionario y el código divergen, no “arreglar” el diccionario para justificar el código existente: identificar la divergencia y decidir cuál debe cambiar.
- No inventar propiedades no documentadas.
- `format_version` representa la compatibilidad mayor del contrato. Dentro de un mismo `format_version` pueden incorporarse aclaraciones y propiedades opcionales compatibles mediante nuevas revisiones de la skill.
- Si un archivo utiliza una propiedad opcional introducida por una revisión más nueva de la skill, el consumidor/editor debe estar actualizado a una revisión que la conozca; un parser estricto antiguo puede rechazarla.
- Proponer una nueva `format_version` sólo cuando el cambio rompa la semántica o estructura existente de forma incompatible.

## Estilo de trabajo

- No sobreingeniería.
- Cambios mínimos y localizados.
- Modularizar por responsabilidad sin crear capas inútiles.
- Pruebas mínimas suficientes.
- Documentar decisiones estructurales reales.
- No adelantar funcionalidades de segunda etapa.

## Compatibilidad

Esta versión de la skill está alineada con:

`format_version: 2`

Cambios principales de v2:

- `display_field` se reemplaza por `display_fields`, lista ordenada de hasta 5 campos.
- se formalizan modos de búsqueda de lookup;
- se incorpora `auditable` por campo;
- se fija el formato canónico de valores temporales;
- se formalizan reglas de lookup frente a lifecycle por estado;
- se documenta el patrón de auditoría global mediante tabla `system`.

Migración mínima desde v1:
`display_field: nombre` → `display_fields: [nombre]`.

No mantener ambos nombres en el contrato canónico.

Si un proyecto declara otra `format_version`, verificar compatibilidad antes de actuar.
