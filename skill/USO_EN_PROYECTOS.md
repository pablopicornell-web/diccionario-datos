# Uso de la Skill Diccionario en proyectos

Versión del documento: 2.0  
Fuente canónica de la skill: el repositorio canónico de la skill

Este documento explica cómo incorporar el sistema **Diccionario** a cualquier proyecto concreto, por ejemplo `proyecto-ejemplo`, de modo que el asistente de diseño (por ejemplo, ChatGPT web o cualquier otro asistente conversacional con acceso al archivo) y el agente de programación (por ejemplo, Codex o cualquier otro agente con acceso al código del proyecto) utilicen exactamente la misma especificación.

La skill y su contrato no se duplican por proyecto. La fuente oficial permanece en el repositorio canónico de la skill.

Archivos canónicos:

- `skill/SKILL.md`
- `skill/ESPECIFICACION_DICCIONARIO.md`
- `skill/VERSION`

El archivo concreto de cada proyecto será `DiccionarioDatos.yaml`, pero su ubicación se define por proyecto.

Cuando el asistente de diseño y el agente de programación deban trabajar sobre el mismo archivo, se recomienda ubicarlo en una carpeta compartida/sincronizada accesible por ambos. En el flujo actual, normalmente será una carpeta de Google Drive sincronizada localmente.

La ruta concreta debe registrarse en `Docs/DICCIONARIO.md` o indicarse explícitamente por el usuario.

---

## Cómo leer este documento

- **Si sos la persona que decide**, empezá por [`PUESTA_EN_MARCHA.md`](PUESTA_EN_MARCHA.md): tiene los pasos en orden, los requisitos de la carpeta compartida y los mensajes listos para copiar y pegar.
- **Si sos el asistente de diseño**, te corresponde la **Parte A** y el **Modo Diseñador**.
- **Si sos el agente de programación**, te corresponde la **Parte B** y el **Modo Implementador**.

| Rol | Modo | Qué se espera de él |
| --- | --- | --- |
| La persona | — | Decide qué datos necesita el sistema, aprueba los cambios, mantiene la carpeta compartida y habilita a los otros dos roles. |
| Asistente de diseño | Modo Diseñador | Convierte necesidades funcionales en modelo de datos y deja las decisiones escritas en el diccionario. |
| Agente de programación | Modo Implementador | Implementa respetando el contrato; si hace falta cambiarlo, se cambia primero el diccionario. |

El sistema funciona con cualquier combinación de herramientas: **no es obligatorio usar ChatGPT ni Codex**. Cuando este documento dice *asistente de diseño* o *agente de programación*, se refiere a roles, no a productos concretos.

---

## 1. Principio general

En un proyecto que adopta Diccionario:

- El asistente de diseño usa la skill en **Modo Diseñador**.
- El agente de programación usa la misma skill en **Modo Implementador**.
- La aplicación local Diccionario es opcional y sirve como editor visual.
- `DiccionarioDatos.yaml` es la única fuente de verdad del modelo de datos del proyecto.
- La skill canónica siempre se mantiene en el repositorio canónico de la skill.
- Cada proyecto local puede instalar una copia de la skill para que el agente de programación la tenga disponible sin depender de releer el repositorio en cada tarea.

La aplicación local, el asistente de diseño y el agente de programación deben interpretar el YAML con el mismo contrato.

---

## 2. Qué debe conocer cada proyecto

Cada proyecto que use Diccionario debe registrar como mínimo:

1. que utiliza el sistema Diccionario;
2. qué versión de la skill utiliza;
3. qué `format_version` utiliza;
4. dónde está su `DiccionarioDatos.yaml`;
5. cómo accede el asistente de diseño al archivo;
6. cómo accede el agente de programación al archivo localmente.

Se recomienda guardar esta información en:

`Docs/DICCIONARIO.md`

Ejemplo para `proyecto-ejemplo`:

```text
Sistema: Diccionario
Repositorio canónico: <repositorio canónico>
Skill: skill/SKILL.md
Versión de skill: 2.0.0
Format version: 2

Archivo maestro:
<ruta compartida definida para este proyecto>

Acceso del asistente de diseño:
Google Drive / carpeta compartida correspondiente

Acceso del agente de programación:
<ruta local sincronizada al mismo archivo>
```

No existe una ruta predeterminada universal. La ruta debe quedar definida para cada proyecto.

---

# PARTE A — EL ASISTENTE DE DISEÑO

## 3. Cómo activar Diccionario con el asistente de diseño

Al comenzar a utilizar Diccionario en un proyecto nuevo, el usuario debe indicarle al asistente de diseño algo equivalente a:

> Este proyecto utiliza el sistema Diccionario.  
> La especificación canónica está en la carpeta `skill/` del repositorio canónico de la skill.  
> Antes de crear, revisar o modificar el modelo de datos, cargá y seguí `skill/SKILL.md` y `skill/ESPECIFICACION_DICCIONARIO.md`.  
> Trabajá en Modo Diseñador.  
> El archivo maestro de este proyecto es `DiccionarioDatos.yaml`. Su ubicación concreta debe tomarse de `Docs/DICCIONARIO.md` o de la indicación explícita del usuario.

El asistente de diseño debe entonces consultar la skill canónica desde el repositorio canónico antes de diseñar o modificar el diccionario.

No depender de recordar una conversación anterior.

Para que la indicación quede guardada en la configuración del asistente y no haya que repetirla en cada conversación, ver "Que no se olvide: dejar la indicación fija" en `PUESTA_EN_MARCHA.md`.

---

## 4. Responsabilidad del asistente de diseño

Cuando el usuario describe una necesidad funcional, el asistente de diseño debe:

1. analizar qué datos necesita el sistema;
2. determinar tablas y campos;
3. definir tipos lógicos y físicos;
4. definir longitudes, precisión y escala;
5. definir PK, FK, relaciones e índices;
6. decidir entre listas fijas y tablas relacionadas;
7. definir metadata visual básica;
8. definir labels y traducciones asociadas al modelo;
9. aplicar lifecycle, deprecación y demás propiedades cuando corresponda;
10. actualizar `DiccionarioDatos.yaml` siguiendo el protocolo de lock, backup e historial.

El objetivo es que el agente de programación reciba las decisiones de datos ya resueltas y tenga que inferir lo mínimo posible.

---

## 5. Creación de un diccionario nuevo desde el asistente de diseño

Si el proyecto todavía no tiene `DiccionarioDatos.yaml` en la ubicación acordada, el asistente de diseño debe:

1. leer la skill canónica;
2. conversar con el usuario sobre las necesidades de datos;
3. resolver las decisiones funcionales necesarias;
4. crear un YAML válido para `format_version` soportado;
5. guardarlo en la ubicación acordada;
6. a partir de ese momento tratarlo como fuente de verdad.

Si la ubicación compartida es Google Drive, el asistente de diseño accede mediante el conector de Google Drive.

Google Drive sólo es transporte/sincronización; no cambia el contrato del archivo.

---

## 6. Modificación de un diccionario existente desde el asistente de diseño

Antes de modificar:

1. leer la skill vigente;
2. leer el `DiccionarioDatos.yaml` actual;
3. comprobar el lock;
4. adquirir lock de escritura;
5. crear backup previo a la primera modificación;
6. realizar todos los cambios de la sesión;
7. validar;
8. guardar de forma segura;
9. generar el Markdown de historial;
10. liberar el lock.

Si encuentra un lock de otro escritor, puede consultar el YAML pero no modificarlo.

---

# PARTE B — EL AGENTE DE PROGRAMACIÓN

## 7. Instalación de la skill en un proyecto del agente de programación

En un proyecto local que adopta Diccionario, el agente de programación debe instalar una copia local de la skill canónica desde:

`skill/` del repositorio canónico

Debe utilizar el mecanismo real de skills disponible en su entorno, si dispone de uno.

No inventar una ubicación si el agente de programación ofrece una carpeta o comando oficial para skills.

La instalación debe incluir como mínimo:

- `SKILL.md`
- `ESPECIFICACION_DICCIONARIO.md`
- `VERSION`

La copia local es una instalación de trabajo. La fuente canónica sigue siendo el repositorio canónico de la skill.

Conviene además dejar la indicación escrita dentro del proyecto —en `AGENTS.md` o en el archivo de instrucciones que el agente lea automáticamente—: ver "Que no se olvide: dejar la indicación fija" en `PUESTA_EN_MARCHA.md`.

Ver "Dónde vive el archivo maestro" más abajo, en esta misma sección, para la ubicación del `DiccionarioDatos.yaml` del proyecto.

### Dónde vive el archivo maestro

El diccionario no se guarda dentro del repositorio del proyecto. Vive en una
carpeta compartida a la que puedan llegar los tres actores que participan:
la persona que decide, el asistente de diseño (Modo Diseñador) y el agente de
programación (Modo Implementador). El editor visual es la herramienta con la
que la persona trabaja sobre ese mismo archivo.

En el flujo actual esa carpeta es una carpeta de Google Drive sincronizada
localmente:

    <Carpeta compartida>/AI-Proyectos/<Proyecto>/
        DiccionarioDatos.yaml
        DiccionarioDatos.lock      (existe sólo durante una sesión de escritura)
        historial/

¿Por qué una carpeta compartida y no el repositorio? Porque el asistente de
diseño no puede ver el disco del equipo, el agente de programación trabaja
sobre la copia sincronizada y el editor abre ese mismo archivo. Google Drive es
el punto de encuentro común y es solo transporte: no forma parte del contrato y
no cambia el formato del archivo.

No hay una ruta predeterminada universal. La ubicación concreta de cada
proyecto se registra en `Docs/DICCIONARIO.md` del proyecto consumidor.

Precauciones propias de una carpeta sincronizada:

- esperá a que termine la sincronización antes de abrir el archivo;
- una sesión de edición equivale a un guardado, como indica el protocolo;
- si el archivo cambió por afuera, el editor avisa y no lo pisa: resolvé el
  conflicto antes de continuar;
- el lock es cooperativo: ordena el trabajo entre los actores, no reemplaza
  la coordinación entre ellos;
- un archivo sincronizado nunca justifica editar a mano por fuera del
  protocolo.

---

## 8. Registro de versión instalada

Cada proyecto debe poder saber qué versión tiene instalada.

Se recomienda registrar en `Docs/DICCIONARIO.md`:

```text
Skill Diccionario instalada: 2.0.0
Format version soportado: 2
Fuente: el repositorio canónico de la skill
```

Cuando la skill canónica cambie, no actualizar automáticamente proyectos existentes sin control.

Primero verificar compatibilidad y luego actualizar la copia local.

La skill 2.0.0 usa `format_version: 2`. El cambio estructural principal es `display_field` → `display_fields`. Los proyectos v1 deben migrar esa propiedad antes de escribir nuevamente el maestro con v2.

---

## 9. Responsabilidad del agente de programación

El agente de programación trabaja en **Modo Implementador**.

Antes de crear o modificar cualquier estructura relacionada con datos debe:

1. leer la skill instalada;
2. leer `Docs/DICCIONARIO.md`;
3. leer `DiccionarioDatos.yaml` en la ruta declarada para el proyecto;
4. utilizar la definición física correspondiente a `database.active_engine`;
5. respetar nombres, relaciones, longitudes, UI básica, lifecycle, i18n y demás metadata definida;
6. no inventar decisiones ya presentes en el diccionario.

El agente de programación debe concentrarse principalmente en implementación y lógica de negocio.

---

## 10. Cuando el agente de programación necesita cambiar el modelo

Si durante el desarrollo el agente de programación detecta que hace falta:

- una tabla;
- un campo;
- una relación;
- un índice;
- una modificación estructural;

no debe modificar únicamente el código o la base.

Primero debe modificarse `DiccionarioDatos.yaml` siguiendo la skill.

Luego se adapta el código al nuevo diccionario.

El diccionario manda sobre el modelo de datos.

---

## 11. Protocolo de modificación para el agente de programación

El agente de programación debe aplicar exactamente el mismo protocolo:

1. lectura libre;
2. comprobar/adquirir lock antes de editar;
3. backup previo a la primera modificación;
4. hash base;
5. cambios;
6. validación;
7. guardado seguro;
8. Markdown de historial;
9. liberar lock.

El origen del historial será normalmente:

`codex`

---

# PARTE C — APLICACIÓN LOCAL DICCIONARIO

## 12. Papel de la aplicación local

La aplicación local no es necesaria para que el sistema Diccionario funcione.

Es una herramienta de comodidad para el usuario.

Permite:

- visualizar;
- editar manualmente;
- validar;
- gestionar historial;
- restaurar versiones;
- detectar conflictos;
- consultar de forma visual el modelo.

La aplicación debe respetar la misma especificación canónica que el asistente de diseño y el agente de programación.

---

# PARTE D — FLUJO DE TRABAJO RECOMENDADO

## 13. Proyecto nuevo

Ejemplo: `proyecto-ejemplo`.

### Paso 1

Adoptar Diccionario.

Crear `Docs/DICCIONARIO.md` con:

- repositorio canónico;
- versión de skill;
- ubicación del YAML;
- accesos del asistente de diseño y del agente de programación.

### Paso 2

El asistente de diseño carga la skill canónica en Modo Diseñador.

### Paso 3

El agente de programación instala la misma skill localmente en Modo Implementador.

### Paso 4

El asistente de diseño y el usuario diseñan `DiccionarioDatos.yaml` en la ubicación compartida definida para el proyecto.

### Paso 5

El agente de programación implementa el proyecto consumiendo ese archivo.

### Paso 6

El usuario puede abrir el mismo archivo con la aplicación visual Diccionario cuando quiera consultarlo o modificarlo manualmente.

---

## 14. Ejemplo de instrucción inicial para el asistente de diseño

```text
Este proyecto utiliza el sistema Diccionario.

Usá como especificación canónica la skill ubicada en:
la carpeta skill/ del repositorio canónico de la skill

Trabajá en Modo Diseñador.

La ubicación de DiccionarioDatos.yaml se define por proyecto. Tomala de Docs/DICCIONARIO.md o de la indicación explícita del usuario. Cuando corresponda, usá la copia compartida de Google Drive.

Antes de diseñar o modificar datos, leé la skill y respetá su protocolo completo.
```

---

## 15. Ejemplo de instrucción inicial para el agente de programación

```text
Este proyecto utiliza el sistema Diccionario.

Instalá o actualizá la skill canónica desde:
`skill/` del repositorio canónico

Usá el mecanismo oficial de skills de tu agente, si dispone de uno.

Registrá la versión instalada en Docs/DICCIONARIO.md.

Trabajá en Modo Implementador.

DiccionarioDatos.yaml es la fuente de verdad del modelo de datos. Usá la ruta declarada para el proyecto en Docs/DICCIONARIO.md o indicada por el usuario; normalmente será la ruta local sincronizada al archivo compartido. Antes de crear o modificar estructuras de datos, leé la skill y el diccionario del proyecto.

No inventes nombres, tipos, relaciones, longitudes, metadata visual ni comportamiento definido ya en el diccionario.
```

---

## 16. Actualización futura de la skill

El mantenimiento se realiza siempre en el repositorio canónico de la skill.

Flujo:

1. modificar especificación/skill en el repositorio canónico;
2. probar el asistente de diseño y el agente de programación contra la nueva versión;
3. incrementar la versión de la skill cuando corresponda;
4. adaptar la aplicación local si el cambio afecta al editor;
5. actualizar otros proyectos sólo cuando se decida hacerlo.

La aplicación local y las skills instaladas en otros proyectos no son la fuente canónica.

La fuente canónica es siempre:

`skill/` del repositorio canónico

---

## 17. Regla final

Nunca mantener dos interpretaciones independientes del formato.

El asistente de diseño, el agente de programación y la aplicación local deben derivar su comportamiento de la misma especificación canónica.
