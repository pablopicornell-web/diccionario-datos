# Puesta en marcha en un proyecto

Esta guía es para **la persona que decide**. Los otros dos actores —el asistente de diseño y el
agente de programación— tienen sus instrucciones en
[`USO_EN_PROYECTOS.md`](USO_EN_PROYECTOS.md); acá está lo que hay que hacer, en orden, y los
mensajes que hay que pasarles.

Funciona con **cualquier combinación de herramientas**. Cuando esta guía dice *asistente de
diseño* se refiere a cualquier asistente conversacional con acceso al archivo del diccionario
(por ejemplo, ChatGPT web); cuando dice *agente de programación* se refiere a cualquier agente
con acceso al código del proyecto (por ejemplo, Codex). No es obligatorio usar ninguno de los
dos en particular.

> **Recomendación: no hagas la instalación a mano; pedísela a los propios agentes.**
> Pasales la dirección de este repositorio y pediles que lo lean, que accedan a la skill y que
> la dejen instalada o disponible. El agente de programación suele ser el que puede instalarla en
> tu equipo; el asistente de diseño, el que puede guardar la indicación en su configuración.
> Basta con que **uno** la instale, pero **los dos** tienen que saber que existe.
> Los mensajes listos para pegar están en los pasos 4 y 5, y el de traspaso entre roles al final
> del paso 5.

---

## Antes de empezar: dónde va a vivir el diccionario

El diccionario **no se guarda dentro del repositorio del proyecto**. Vive en una carpeta
compartida, porque los tres actores tienen que poder llegar al mismo archivo:

- el asistente de diseño **no puede ver el disco** de tu equipo;
- el agente de programación trabaja sobre la **copia local sincronizada**;
- el editor abre **ese mismo archivo**.

### Paso 0 — Preparar la carpeta compartida

1. En **Google Drive**, creá una carpeta para el proyecto. La convención del flujo actual es
   `AI-Proyectos/<Proyecto>`.
2. Instalá **Google Drive para escritorio** e iniciá sesión, para que esa carpeta quede
   **sincronizada y disponible localmente** en tu equipo (aparece en el Explorador de Windows,
   como "Mi unidad" o como unidad virtual). Sin este paso, el agente de programación y el editor
   no ven el archivo, y el asistente de diseño tampoco, porque el punto de encuentro es Drive.
3. Verificá que puedas crear un archivo en esa carpeta desde el Explorador y verlo después en
   Drive web. Esa ida y vuelta es la que garantiza que los tres actores van a ver lo mismo.

Adentro de esa carpeta van a convivir tres cosas:

```text
<Carpeta compartida>/AI-Proyectos/<Proyecto>/
    DiccionarioDatos.yaml          el archivo maestro: la fuente de verdad
    DiccionarioDatos.lock          existe sólo mientras hay una sesión de escritura
    historial/                     los respaldos y el resumen de cada sesión de edición
```

**Google Drive es solo transporte.** No forma parte del contrato y no cambia el formato del
archivo: si mañana usás otra carpeta compartida, el diccionario es el mismo.

### Precauciones de una carpeta sincronizada

- Esperá a que **termine la sincronización** antes de abrir o editar el archivo.
- **Una sesión de edición equivale a un guardado**, como indica el protocolo.
- Si un programa externo cambió el archivo, el editor **avisa y no lo pisa**: resolvé el
  conflicto antes de continuar.
- El bloqueo (`DiccionarioDatos.lock`) es **cooperativo**: ordena el trabajo entre los actores,
  no reemplaza la coordinación entre ellos.
- Drive nunca justifica editar el archivo **por fuera del protocolo**.

---

## Paso 1 — Poner el archivo maestro

**Si el proyecto ya tiene un `DiccionarioDatos.yaml`**, copialo a la carpeta compartida.

**Si empieza de cero**, creá ahí mismo un archivo llamado `DiccionarioDatos.yaml`. Podés partir
de [`../examples/diccionario-ejemplo.yaml`](../examples/diccionario-ejemplo.yaml), que es un
contrato válido y mínimo, y adaptarlo. El contenido mínimo es:

```yaml
format_version: 2
schema_version: 1

project:
  name: <Proyecto>
  default_language: es
  languages: [es]
  locale: es-AR

database:
  active_engine: sqlite
  engines: [sqlite]

tables: []
```

A partir de este momento, **ese archivo es la fuente de verdad** del modelo de datos del
proyecto: lo que el código diga de menos se corrige en el diccionario primero.

---

## Paso 2 — Registrar la decisión en el proyecto

En el proyecto (el repositorio de código), creá el archivo `Docs/DICCIONARIO.md` con este
contenido, completando tus valores reales:

```text
Sistema: Diccionario
Skill: skill/SKILL.md y skill/ESPECIFICACION_DICCIONARIO.md
Versión de skill: 2.0.0
Format version: 2

Archivo maestro:
<ruta local sincronizada>/DiccionarioDatos.yaml

Acceso del asistente de diseño:
Google Drive, carpeta compartida AI-Proyectos/<Proyecto>

Acceso del agente de programación:
<la misma ruta local sincronizada>
```

Esto es lo que permite que los dos actores encuentren el archivo **sin depender de recordar una
conversación anterior**.

---

## Paso 3 — Abrilo con el editor

1. Descargá la aplicación (está en la sección **Releases** de este repositorio) o compilala
   siguiendo el [README](../README.md).
2. Abrí el `DiccionarioDatos.yaml` de la carpeta compartida.
3. Comprobá que abajo diga **0 errores**. Las advertencias no impiden guardar.

Si el editor avisa que el archivo está bloqueado, hay una sesión de escritura abierta en otro
lado: cerrala o esperá a que termine.

---

## Paso 4 — Avisarle al asistente de diseño

**Los pasos 4 y 5 se pueden dar en cualquier orden, y cualquiera de los dos roles puede
encargarse de la instalación.** No hace falta que hagas nada a mano: pasale la dirección de
este repositorio y pedile que lo lea, que acceda a la skill y que la deje instalada o
disponible en su entorno. Después avisale al otro rol, porque **los dos necesitan la skill**
para trabajar con el mismo criterio: el mensaje de traspaso está al final del Paso 5.

Pegale este mensaje **una vez por proyecto**, reemplazando `<URL del repositorio>` por la
dirección de este repositorio (es la que ves en la barra del navegador):

> Este proyecto usa el sistema **Diccionario**.
> El repositorio canónico es `<URL del repositorio>`. Leelo, accedé a la carpeta `skill/` y
> dejá la skill instalada o disponible en tu entorno si podés hacerlo.
> Antes de crear, revisar o modificar el modelo de datos, seguí `skill/SKILL.md` y
> `skill/ESPECIFICACION_DICCIONARIO.md`.
> Trabajá en **Modo Diseñador**.
> El archivo maestro de este proyecto es `DiccionarioDatos.yaml`; su ubicación exacta está
> registrada en `Docs/DICCIONARIO.md`.
> Toda modificación del maestro sigue el protocolo de bloqueo, respaldo, historial y guardado
> seguro que describe la skill.
> Avisame cuando lo tengas listo, así se lo paso también al rol que programa.

Desde ese momento, cuando le pidas algo funcional, debería traducirlo a tablas, campos, tipos y
relaciones, y dejarlo escrito en el diccionario.

---

## Paso 5 — Avisarle al agente de programación

Es el rol que normalmente **puede instalar cosas en tu equipo**, así que si preferís empezar por
acá, pedile directamente que haga la instalación. Pegale este mensaje, reemplazando
`<URL del repositorio>`:

> Este proyecto usa el sistema **Diccionario**.
> El repositorio canónico es `<URL del repositorio>`. Leelo, descargalo si hace falta e instalá
> la skill en tu entorno con tu mecanismo oficial de skills; si no disponés de uno, dejá la
> carpeta `skill/` accesible. Tenerla instalada evita releer el repositorio en cada tarea.
> Antes de crear o modificar estructuras de datos, leé el diccionario del proyecto, cuya ruta
> está en `Docs/DICCIONARIO.md`.
> Trabajá en **Modo Implementador**: usá la definición física del motor activo y no inventes
> nombres, tipos, longitudes, relaciones, etiquetas ni presentación que ya estén definidos.
> Si el desarrollo necesita cambiar el modelo, primero se modifica el diccionario y después el
> código. La divergencia no se resuelve "arreglando" el diccionario para justificar el código.

### Mensaje de traspaso entre roles

Cuando uno de los dos ya leyó o instaló la skill, avisale al otro con algo así:

> Ya quedó leída e instalada la skill de **Diccionario** desde `<URL del repositorio>`.
> Te la paso para que la uses en tu rol —**Modo Diseñador** o **Modo Implementador**, según
> corresponda—. El archivo maestro del proyecto es `DiccionarioDatos.yaml` y su ubicación está
> registrada en `Docs/DICCIONARIO.md`.

Los dos roles necesitan la skill: el que diseña, para saber cómo se escribe cada propiedad; el
que programa, para no inventar lo que ya está definido. Que uno la tenga instalada no exime al
otro de conocerla.

---

## Que no se olvide: dejar la indicación fija

Una indicación pegada una vez se pierde: el asistente abre un chat nuevo y no se acuerda, o el
agente arranca otra sesión sin el contexto. Para que cada rol lo sepa **siempre**, la indicación
tiene que quedar guardada donde ese rol la lee por costumbre.

### Asistente de diseño

- **Guardá la indicación en su configuración.** Si tu asistente tiene "proyectos" o
  "instrucciones personalizadas", pegá ahí el mensaje del Paso 4: queda aplicado en todas las
  conversaciones de ese proyecto sin volver a escribirlo.
- **Dejale la skill a mano.** Si podés adjuntar archivos al proyecto, subí `SKILL.md` y
  `ESPECIFICACION_DICCIONARIO.md` descargados del repositorio. Así no depende de leerlos desde
  GitHub en cada conversación.
- **Si no tiene ninguna de esas funciones**, guardá el mensaje en un archivo tuyo y pegalo al
  comenzar cada conversación nueva.

### Agente de programación

- **Escribí la indicación dentro del proyecto.** Va en `AGENTS.md` —o en el archivo de
  instrucciones que tu agente lea automáticamente—. Es lo que hace que la cumpla en cada sesión
  sin que se lo recuerdes, y es como funcionan hoy los proyectos que ya usan Diccionario.
- **La skill puede ser global; la indicación no.** Instalar la skill una vez para todos tus
  proyectos es cómodo y no molesta a nadie. Lo que **no** conviene es dejar global la frase "este
  proyecto usa Diccionario", porque en los proyectos que no lo usan sería una orden equivocada.
- **Si no hay mecanismo de skills**, dejá la carpeta `skill/` dentro del proyecto y apuntá a ella
  desde `AGENTS.md`.

### La regla que hace que se den cuenta solos

Dejá escrita esta regla para los dos roles y no dependas de acordarte:

> Antes de crear o modificar estructuras de datos, comprobá si el proyecto usa **Diccionario**:
> si existe `Docs/DICCIONARIO.md`, o un `DiccionarioDatos.yaml` en la ubicación registrada, el
> proyecto lo usa y hay que respetar el contrato. Si no existe, no lo apliques ni lo inventes.
> Si dudás, preguntá antes de tocar el modelo.

Así el sistema se activa **cuando vos decidís usarlo** en un proyecto, y no se mete donde no
corresponde.

### Cómo comprobar que quedó bien configurado

Una prueba de humo, una vez por proyecto: pedile a cada rol algo que solo puede responder si leyó
el diccionario. Por ejemplo: *"¿qué tablas tiene este proyecto y cuál es el motor activo?"*. Si
contesta con los datos reales del archivo, quedó configurado. Si improvisa, o pregunta de qué le
estás hablando, falta la indicación o falta el archivo.

## Quién hace qué

| Actor | Responsabilidad | Cómo |
| --- | --- | --- |
| **La persona** | Decide qué datos necesita el sistema, aprueba los cambios y mantiene la carpeta compartida. Es el único que autoriza modificaciones sensibles. | El editor y esta guía |
| **Asistente de diseño** | Traduce necesidades funcionales a tablas, campos, tipos, relaciones y presentación. Deja las decisiones resueltas por escrito. | **Modo Diseñador**, sobre el archivo maestro |
| **Agente de programación** | Consume el contrato: crea y modifica estructuras de datos respetando lo ya definido. | **Modo Implementador**, leyendo el diccionario |
| **El editor** | Abre, valida y guarda el archivo con bloqueo, respaldo e historial. | La aplicación de escritorio |

---

## Lista de verificación

- [ ] Carpeta creada en Google Drive y **sincronizada localmente** con Google Drive para escritorio.
- [ ] `DiccionarioDatos.yaml` en esa carpeta.
- [ ] `Docs/DICCIONARIO.md` en el proyecto, con la ruta real.
- [ ] El editor abre el archivo y muestra **0 errores**.
- [ ] El asistente de diseño leyó la skill y trabaja en Modo Diseñador.
- [ ] El agente de programación tiene la skill instalada y el mensaje del Paso 5.
- [ ] **Los dos roles quedaron avisados de que existe la skill**, aunque la instalación la haya
      hecho uno solo de ellos.
- [ ] Probaste un cambio de punta a punta: pediste un campo nuevo, quedó escrito en el
      diccionario, y el agente lo respetó al implementarlo.

---

## Si algo no cierra

- **El asistente de diseño no encuentra el archivo**: verificá que esté en Drive y que la
  carpeta esté compartida con la cuenta correcta.
- **El agente de programación no ve el archivo**: verificá que Google Drive para escritorio esté
  sincronizando esa carpeta en ese equipo.
- **El editor dice que el archivo está bloqueado**: quedó una sesión de escritura abierta;
  cerrala y volvé a intentar.
- **Aparecen copias duplicadas en Drive**: hubo dos escrituras simultáneas. El protocolo existe
  justamente para evitarlo: una sesión de edición por vez.
- **El diccionario y el código dicen cosas distintas**: no se "arregla" el diccionario para
  justificar el código. Se identifica la divergencia y se decide cuál de los dos cambia.
