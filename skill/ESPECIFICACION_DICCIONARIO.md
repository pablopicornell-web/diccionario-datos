# Especificación canónica de DiccionarioDatos.yaml

Versión de especificación: 2.0.0  
Formato YAML: `format_version: 2`

## 1. Principio

`DiccionarioDatos.yaml` es la única fuente de verdad para la definición estructural de datos y su metadata básica de presentación.

Debe ser legible por humanos y agentes, mantener orden estable y evitar información duplicada.

## 2. Cabecera

```yaml
format_version: 2
schema_version: 1

project:
  name: ejemplo
  description: Sistema de gestión de ejemplo
  default_language: es
  languages: [es, en, pt]
  locale: es-AR

database:
  active_engine: sqlite
  engines: [sqlite]

tables: []
```

- `format_version`: versión del contrato del archivo.
- `schema_version`: versión estructural del proyecto.
- `database.active_engine`: motor que debe usar el implementador.
- `database.engines`: motores para los que existen o pueden existir definiciones físicas.

## 3. Tablas

Las tablas son una lista ordenada.

Propiedades admitidas:

- `name` obligatorio: identificador técnico canónico.
- `physical_name` opcional.
- `code_alias` opcional.
- `label` multilenguaje.
- `description`, `notes`.
- `status`: `active` o `deprecated`.
- `table_role`: `main`, `lookup`, `transaction`, `system`.
- `display_fields` opcional: lista ordenada de 1 a 5 campos existentes de la tabla.
- `primary_key`: lista de campos.
- `lifecycle`.
- `ui`.
- `fields`.
- `indexes`.
- `unique_constraints`.

## 4. Campos

Los campos son una lista ordenada. Su orden es también el orden visual por defecto.

Propiedades admitidas:

- `name`
- `physical_name`
- `label`
- `description`
- `notes`
- `logical_type`
- `length`
- `precision`
- `scale`
- `required`
- `unique`
- `default`
- `semantic`
- `validation`
- `allowed_values`
- `relation`
- `generated`
- `calculated`
- `physical`
- `ui`
- `status`
- `deprecation`
- `auditable`

## 5. Tipos lógicos v1

- `string`
- `text`
- `integer`
- `decimal`
- `boolean`
- `date`
- `time`
- `datetime`
- `datetime_tz`
- `duration`
- `binary`
- `json`
- `uuid`

### Strings

`length` es la cantidad máxima lógica de caracteres. No distinguir CHAR/VARCHAR en la capa lógica.

### Decimal

`precision`: dígitos totales.  
`scale`: posiciones decimales.

### Temporales

`date`: fecha. Valor canónico textual `YYYY-MM-DD`.  
`time`: hora del día. Valor canónico textual `HH:MM:SS`.  
`datetime`: fecha + hora sin zona. Valor canónico textual `YYYY-MM-DDTHH:MM:SS`.  
`datetime_tz`: fecha + hora con zona. Valor canónico textual `YYYY-MM-DDTHH:MM:SS±HH:MM`.  
`duration`: cantidad de tiempo; unidad inicial: `seconds`, `milliseconds` o `minutes`.

Estos formatos canónicos son independientes del locale. La presentación visible puede adaptarse al locale de la aplicación. Si el motor usa un tipo temporal nativo, debe preservar la misma semántica; cuando se serializa/intercambia como texto se usa el formato canónico.

## 6. Definición física

Cada campo puede tener una definición por motor.

```yaml
logical_type: string
length: 60

physical:
  sqlite:
    type: TEXT
  postgres:
    type: VARCHAR
    length: 60
```

El implementador usa sólo la variante de `database.active_engine`.

## 7. Semántica

`semantic.kind` es opcional y complementa el tipo lógico.

Valores v1:

- `email`
- `phone`
- `currency`
- `percentage`
- `password_hash`
- `url`
- `identifier`
- `code`
- `file_path`
- `mime_type`
- `rich_text`
- `html`
- `latitude`
- `longitude`
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `deleted_at`

Moneda y porcentaje siguen siendo `decimal`.

## 8. Required y valores vacíos

- `required: true`: no admite `null`.
- `0`, `false` y `""` son valores, no null.
- Para texto puede usarse `validation.allow_empty: false`.

## 9. Defaults

Literal:

```yaml
default:
  kind: literal
  value: 0
```

Sistema:

```yaml
default:
  kind: system
  value: current_datetime
```

Valores de sistema v1:

- `current_date`
- `current_time`
- `current_datetime`
- `current_user`

No usar sintaxis específica del motor en la capa lógica.

## 10. Generación de identificadores

```yaml
generated:
  strategy: auto_increment
```

Estrategias v1:

- `manual`
- `auto_increment`
- `uuid`
- `ulid`
- `sequence`

## 11. Claves y unicidad

PK siempre a nivel tabla:

```yaml
primary_key:
  - id
```

Unicidad individual:

```yaml
unique: true
```

Compuesta:

```yaml
unique_constraints:
  - fields: [empresa_id, codigo]
```

## 12. Relaciones

```yaml
relation:
  table: localidades
  field: id
  on_delete: restrict
  on_update: cascade
```

Acciones v1:

- `restrict`
- `cascade`
- `set_null`
- `no_action`

`set_null` requiere campo no obligatorio.

Una relación administrable debe tener su tabla explícita en el diccionario. No inferirla en código.

### Relaciones usadas como lookup

Cuando un campo relacional se presenta con `ui.control: lookup`:

- la FK persiste la clave indicada por `relation.field`;
- el usuario no ve ni edita directamente esa clave interna;
- el valor visible se forma con `display_fields` de la tabla relacionada;
- no repetir en cada lookup qué campos mostrar si la tabla relacionada ya define `display_fields`;
- un override por lookup queda fuera de v2 hasta que exista un caso real que lo justifique.

Si la tabla destino usa `lifecycle.delete_mode: status`:

- para nuevas asignaciones, excluir normalmente los registros cuyo lifecycle field tenga `deleted_value`;
- si una FK histórica ya apunta a un registro dado de baja, seguir resolviéndolo y mostrándolo;
- no limpiar ni romper la FK por una baja lógica;
- esto no altera las reglas de hard delete/restrict/set_null/cascade.

## 13. Display fields

Una tabla referenciada puede declarar una representación compuesta:

```yaml
display_fields:
  - apellido
  - nombre
  - numero_documento
```

Reglas:

- es una lista ordenada de 1 a 5 campos existentes de la misma tabla;
- la FK almacena la clave real;
- la UI muestra la representación formada por esos campos en ese orden;
- `display_fields` pertenece a la tabla, no a cada campo que la referencia;
- es opcional globalmente, pero fuertemente recomendado para tablas `lookup` y tablas referenciadas;
- no codificar reglas especiales para homónimos: el proyecto decide qué campos componen la representación;
- el separador visual entre componentes es una convención de UI y no forma parte del contrato v2.

En editores visuales, los campos se seleccionan desde combos de campos existentes. Se permiten hasta 5 posiciones y pueden quedar posiciones vacías al editar, pero al guardar sólo se persisten nombres válidos no vacíos y sin duplicados.

Si se intenta eliminar un campo usado en `display_fields`, primero debe retirarse o reemplazarse de esa lista.

`display_fields` no define el orden ni limita búsquedas. No generar automáticamente un índice compuesto a partir de `display_fields`.

Migración desde v1:

`display_field: nombre` → `display_fields: [nombre]`.

## 14. Valores permitidos

```yaml
allowed_values:
  - value: A
    label:
      es: Activo
      en: Active
    order: 1
    active: true
```

Sólo `value` es imprescindible. `label`, `order`, `active`, `color`, `notes` son opcionales.

Usar `allowed_values` para listas pequeñas, cerradas y estructurales. Usar tabla relacionada para valores administrables o compartidos.

## 15. Índices

```yaml
indexes:
  - name: idx_apellido_nombre
    unique: false
    fields:
      - name: apellido
        order: asc
      - name: nombre
        order: asc
```

Cada componente admite `asc` o `desc`.

Regla de diseño para evitar redundancias:

- si `unique: true` sobre un campo o un `unique_constraints` compuesto ya garantiza unicidad y el motor genera/implica el índice necesario sobre exactamente los mismos campos, no crear automáticamente un segundo índice no único idéntico salvo razón explícita;
- aplicar el mismo criterio a un `display_field` único.

No incluir en v1 índices parciales, expresiones o INCLUDE.

## 16. Orden de grillas

```yaml
ui:
  default_sort: idx_apellido_nombre
  available_sorts:
    - index: idx_apellido_nombre
      label:
        es: Apellido y nombre
```

Los órdenes visuales reutilizan índices definidos; no duplicar la definición.

`display_fields` y `default_sort` son conceptos distintos:

- `display_fields`: qué componentes forman la representación visible del registro;
- `default_sort`: en qué orden se presentan los registros.

Una tabla puede mostrar `nombre` y ordenar por otro campo, por ejemplo `orden_visual`.

Si se necesita un orden visual específico, modelarlo como un campo normal + índice + `default_sort`. No crear una propiedad especial adicional sólo para ese caso.

## 17. Campos calculados

```yaml
calculated:
  enabled: true
  expression: "cantidad * precio_unitario"
  stored: false
```

La expresión es lógica/descriptiva. v1 no define un lenguaje universal de fórmulas.

## 18. Validaciones por campo

Admitir:

- `min`
- `max`
- `min_length`
- `pattern`
- `allow_empty`

No duplicar `length` con `max_length`.

No existen validaciones cruzadas entre campos en v1.

## 19. Metadata visual de campo

```yaml
ui:
  control: text
  width: 250
  align: left
  form_visible: true
  form_readonly: false
  list_visible: true
  searchable: true
  filterable: true
  sortable: true
  column_width: 180
  column_flexible: false
```

Controles v1:

- `text`
- `textarea`
- `number`
- `checkbox`
- `switch`
- `radio`
- `select`
- `lookup`
- `date`
- `time`
- `datetime`
- `password`
- `rich_text_editor`

Si `control` falta, puede deducirse. Si existe, prevalece.

### Checkbox versus switch

- `checkbox`: booleano presentado como casilla de selección.
- `switch`: booleano o estado binario presentado como toggle de dos estados claramente opuestos.

Ambos coexisten; uno no sustituye al otro.

### Metadata de lookup

Para un campo con `ui.control: lookup`:

```yaml
ui:
  control: lookup
  lookup:
    allow_create: true
    search_modes:
      - prefix
      - contains
    default_search_mode: prefix
    user_can_switch_mode: true
```

Reglas:

- `allow_create` es opcional; por defecto `false`;
- `search_modes` puede contener `prefix` y/o `contains`;
- si no se declara, asumir `[prefix]`;
- `default_search_mode` debe pertenecer a `search_modes`; por defecto `prefix`;
- `user_can_switch_mode` por defecto `false`;
- la preferencia elegida en ejecución por usuario/terminal no se guarda en el diccionario.

Semántica:

- `prefix`: coincidencia desde el comienzo del texto;
- `contains`: coincidencia en cualquier parte;
- la búsqueda normal se realiza sobre la representación de `display_fields`;
- no incorporar fuzzy search en v2.

Alta inmediata cuando `allow_create: true`:

1. el usuario escribe y ve coincidencias;
2. si no encuentra el valor, el control ofrece una acción clara de alta rápida, por ejemplo botón “+”;
3. esa acción abre el formulario normal de alta de la tabla relacionada;
4. cuando sea razonable, el texto escrito puede precargarse en el primer `display_fields`;
5. al confirmar, se refresca el lookup y el nuevo registro queda seleccionado;
6. al cancelar, el lookup conserva su estado anterior;
7. no mantener listas paralelas ni valores embebidos.

Para una FK opcional, el lookup comienza sin selección y no elige automáticamente el primer registro.

Para una FK obligatoria, una selección inicial sólo existe si el proyecto la define expresamente. El orden de presentación deriva de `default_sort` o índices, no del ID por defecto.

Alineación:

- `left`
- `center`
- `right`

Defaults razonables: texto izquierda, número derecha, booleano centro.

## 20. Formato numérico visual

```yaml
ui:
  format:
    thousands_separator: true
    decimal_places: 2
    leading_zeros: 5
```

No modifica el valor persistido.

## 21. UI de tabla

```yaml
ui:
  maintenance: true
  navigation:
    section: configuration
  actions:
    create: true
    edit: true
    delete: true
    view: true
```

Secciones v2:

- `main`
- `configuration`
- `hidden`

Convenciones globales de CRUD:

- Alta y edición reutilizan el mismo formulario.
- Acciones de fila al extremo derecho.
- Eliminar respeta `lifecycle`.

## 22. Lifecycle

Hard:

```yaml
lifecycle:
  delete_mode: hard
```

Soft:

```yaml
lifecycle:
  delete_mode: soft
  field: deleted_at
```

Estado:

```yaml
lifecycle:
  delete_mode: status
  field: estado
  deleted_value: inactive
```

Un campo que participa en `lifecycle.delete_mode: status` no queda automáticamente oculto ni readonly. Puede seguir siendo editable, por ejemplo mediante `ui.control: switch`, si así lo define la metadata UI.

## 23. i18n

El proyecto declara idiomas y uno por defecto.

Labels relacionados con datos pueden ser multilenguaje.

Ejemplo de clave derivada:

`table.clientes.field.apellido.label`

No guardar una clave i18n redundante si puede derivarse. No codificar labels literales en UI.

Textos generales de aplicación quedan fuera del diccionario.

## 24. Deprecación

```yaml
status: deprecated

deprecation:
  since_schema_version: 7
  replacement: localidad_id
  notes: Reemplazado por relación con localidades.
```

Los elementos deprecados siguen en el YAML pero no deben usarse para desarrollo nuevo.

## 25. Schema version

Incrementar ante cambios estructurales o semánticos que afecten persistencia/validez:

- tablas o campos agregados/eliminados/deprecados;
- tipos;
- PK/FK;
- relaciones;
- restricciones;
- propiedades de almacenamiento.

No incrementar por:

- label;
- description;
- notes;
- traducciones;
- anchos;
- alineación;
- visibilidad;
- cambios visuales.

## 26. Validación del diccionario

Errores que impiden guardar:

- nombres duplicados;
- PK/FK/índices/display_field con referencias inexistentes;
- `set_null` sobre campo required;
- `min > max`;
- `scale > precision`;
- default incompatible;
- allowed_values incompatible;
- default_sort inexistente;
- active_engine no declarado.

Advertencias no impiden guardar; ejemplo: lookup sin display_field.

## 27. Protocolo de concurrencia e historial

Lectura siempre permitida. Un solo escritor mediante `DiccionarioDatos.lock`.

El lock registra al menos:

- owner
- machine cuando exista
- created_at
- base_sha256

Antes de la primera modificación de una sesión crear una copia previa en `historial/`.

Al terminar correctamente, crear Markdown compañero con resumen completo de cambios.

Antes de sobrescribir verificar hash base. Si cambió externamente, abortar y recargar. No merge automático.

## 28. Formato canónico

- Orden estable.
- Tablas/campos/listas preservan su orden.
- No reformatear masivamente sin motivo.
- No usar comentarios YAML como documentación normal.
- Usar `description` y `notes`.

## 29. Tablas internas y muchos-a-muchos

La existencia de una tabla no implica una pantalla propia.

Una tabla intermedia muchos-a-muchos puede modelarse como tabla real con campos propios y declararse:

```yaml
ui:
  maintenance: false
  navigation:
    section: hidden
```

Interpretación obligatoria:

- no generar navegación;
- no generar CRUD independiente;
- administrar la relación desde los módulos/pantallas correspondientes;
- la tabla puede tener ID, FKs, auditoría y campos adicionales si el dominio lo requiere.

No agregar propiedades nuevas para este caso mientras `maintenance: false` + `hidden` sean suficientes.

## 30. Tablas lookup administrables

Una tabla con `table_role: lookup` es una tabla normal y administrable, no una lista embebida.

Puede tener:

- ID;
- `display_field`;
- lifecycle/estado;
- auditoría;
- índices;
- UI y navegación;
- relaciones desde otras tablas;
- campos adicionales propios;
- alta inmediata desde un lookup cuando `ui.lookup.allow_create: true`.

Los registros creados desde un lookup deben persistirse en la tabla relacionada y después poder verse, editarse, darse de baja o eliminarse según su lifecycle desde la sección de mantenimiento correspondiente.

Usar `allowed_values` sólo para listas pequeñas, cerradas, estructurales y que no requieren mantenimiento por parte del usuario.

## 31. Auditoría estándar recomendada

Patrón recomendado, no obligatorio universalmente:

- `created_at`
  - `semantic.kind: created_at`
  - automático al crear;
  - no editable manualmente.
- `updated_at`
  - `semantic.kind: updated_at`
  - automático al modificar;
  - no editable manualmente.
- `created_by`
  - `semantic.kind: created_by`
  - usar usuario actual cuando exista;
  - puede ser null mientras no exista sistema de usuarios;
  - no editable manualmente.
- `updated_by`
  - `semantic.kind: updated_by`
  - mismo criterio;
  - puede ser null mientras no exista sistema de usuarios;
  - no editable manualmente.

Este patrón se implementa con las semánticas existentes; no requiere propiedades nuevas.

## 32. Auditoría global y campos auditables

La auditoría global, cuando el proyecto la requiera, se modela como una tabla normal explícita con `table_role: system`.

Patrón recomendado:

- navegación en `configuration`;
- acciones `create/edit/delete: false`;
- `view: true`;
- registros generados automáticamente por el sistema.

Estructura conceptual mínima:

- `id`: correlativo;
- `fecha_hora`: datetime/datetime_tz según proyecto;
- `tabla`: string;
- `registro_id`: string suficientemente amplio para IDs enteros convertidos a texto, UUID, ULID u otros identificadores simples;
- `operacion`: lista cerrada inicialmente `alta`, `modificacion`, `baja`, `reactivacion`, `eliminacion`;
- `usuario_id`: relación o identificador opcional según el sistema;
- `detalle`: text libre.

No agregar soporte especial para PK compuestas/JSON mientras no exista necesidad real.

### Propiedad auditable

Un campo puede declarar:

```yaml
auditable: true
```

Por defecto, si falta, asumir `false`.

Semántica:

- cambios en campos no auditables no generan detalle histórico por sí solos;
- uno o varios cambios auditables dentro de la misma operación pueden consolidarse en un único evento de modificación;
- no generar un evento por cada campo;
- un alta normal no necesita evento global sólo por existir, porque `created_at/created_by` ya lo registran;
- bajas, reactivaciones y eliminaciones pueden registrarse por su relevancia;
- el Modo Diseñador puede inferir `auditable` cuando sea razonable, pero si la relevancia funcional no es clara debe preguntar.

El texto libre del detalle se conserva exactamente en el idioma ingresado. La UI puede traducir nombres de tabla/campo, operaciones y valores codificados mediante metadata i18n, pero no traducir automáticamente observaciones históricas libres.

## 33. Decisiones de modelado

- Dos teléfonos fijos y conocidos pueden ser dos campos; cantidad variable requiere tabla relacionada.
- Dirección no es un tipo especial: modelarla según el nivel de detalle necesario.
- Ubicación puntual: latitude/longitude.
- GIS complejo queda fuera de v1.
- Rich text/HTML: `text` + semántica.
- Binary existe pero debe usarse sólo cuando tenga sentido.
- JSON existe, pero no sustituye un diseño relacional normal.

## 34. Compatibilidad y migración desde format_version 1

`format_version: 2` reemplaza a v1 para el contrato canónico actual.

El cambio que justifica la nueva versión es estructural:

- `display_field` (escalar) se reemplaza por `display_fields` (lista de hasta 5 campos).

Migración mínima:

```yaml
# v1
display_field: nombre

# v2
display_fields:
  - nombre
```

Las demás incorporaciones de v2 son principalmente metadata o semántica adicional:

- modos de búsqueda de lookup;
- lookup frente a lifecycle por estado;
- `auditable`;
- formatos temporales canónicos;
- reglas de tablas intermedias;
- patrón de auditoría global.

No mantener `display_field` como alias canónico en v2. Un consumidor que quiera importar v1 puede migrarlo explícitamente, pero los archivos nuevos deben escribirse en v2.

## 35. Fuera de format_version 2

No forman parte del contrato v1:

- migraciones automáticas;
- vistas y datasets derivados;
- permisos por rol;
- validaciones cruzadas;
- layout complejo;
- agrupación visual de campos;
- GIS avanzado;
- merge concurrente;
- datos de prueba dentro del maestro;
- generación de arquitectura/capas de código.

Las migraciones, vistas/datasets derivados, generación de datos de prueba y exportación i18n son evoluciones posteriores previstas, fuera del contrato v1.
