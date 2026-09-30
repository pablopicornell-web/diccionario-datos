import { getLabel, setLabel } from "./labels.ts";
import type { Document, Field, Table, TableUI } from "./model.ts";
import { MAX_DISPLAY_FIELDS, cloneDocument, createField, createTable } from "./model.ts";

/** Índice seguro dentro de una lista. */
function clampIndex(index: number, length: number): number {
  if (index < 0) {
    return 0;
  }
  if (index >= length) {
    return length - 1;
  }
  return index;
}

/** Devuelve la tabla, o `undefined` si no existe. */
export function findTable(document: Document, name: string): Table | undefined {
  return document.tables.find((table) => table.name === name);
}

/** Devuelve el campo, o `undefined` si no existe. */
export function findField(table: Table | undefined, name: string): Field | undefined {
  return table?.fields.find((field) => field.name === name);
}

/** Genera un nombre libre a partir de una base. */
export function uniqueName(base: string, existing: string[]): string {
  if (!existing.includes(base)) {
    return base;
  }
  let index = 2;
  while (existing.includes(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
}

/** Agrega una tabla nueva al final. */
export function addTable(document: Document, baseName = "nueva_tabla"): Document {
  const next = cloneDocument(document);
  const name = uniqueName(baseName, next.tables.map((table) => table.name));
  const table = createTable(name);
  table.fields = [createField("id")];
  table.primary_key = ["id"];
  next.tables.push(table);
  return next;
}

/** Elimina una tabla y las referencias que quedan apuntando a ella. */
export function removeTable(document: Document, name: string): Document {
  const next = cloneDocument(document);
  next.tables = next.tables.filter((table) => table.name !== name);
  for (const table of next.tables) {
    for (const field of table.fields) {
      if (field.relation?.table === name) {
        field.relation = null;
      }
    }
  }
  return next;
}

/** Mueve una tabla una posición hacia arriba o hacia abajo. */
export function moveTable(document: Document, name: string, delta: number): Document {
  const next = cloneDocument(document);
  const index = next.tables.findIndex((table) => table.name === name);
  if (index < 0) {
    return next;
  }
  const target = index + delta;
  if (target < 0 || target >= next.tables.length) {
    return next;
  }
  const [moved] = next.tables.splice(index, 1);
  next.tables.splice(target, 0, moved);
  return next;
}

/** Renombra una tabla y actualiza todas las referencias internas. */
export function renameTable(document: Document, from: string, to: string): Document {
  const next = cloneDocument(document);
  if (from === to || !next.tables.some((table) => table.name === from)) {
    return next;
  }
  for (const table of next.tables) {
    if (table.name === from) {
      table.name = to;
    }
    for (const field of table.fields) {
      if (field.relation?.table === from) {
        field.relation.table = to;
      }
    }
  }
  return next;
}

/** Agrega un campo nuevo al final de la tabla. */
export function addField(document: Document, tableName: string, baseName = "nuevo_campo"): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  const name = uniqueName(baseName, table.fields.map((field) => field.name));
  table.fields.push(createField(name));
  return next;
}

/** Elimina un campo y limpia las referencias que dependían de él. */
export function removeField(document: Document, tableName: string, fieldName: string): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  table.fields = table.fields.filter((field) => field.name !== fieldName);
  table.primary_key = table.primary_key.filter((name) => name !== fieldName);
  table.display_fields = table.display_fields.filter((name) => name !== fieldName);
  table.indexes = table.indexes
    .map((index) => ({
      ...index,
      fields: index.fields.filter((item) => item.name !== fieldName),
    }))
    .filter((index) => index.fields.length > 0);
  table.unique_constraints = table.unique_constraints
    .map((constraint) => ({
      fields: constraint.fields.filter((name) => name !== fieldName),
    }))
    .filter((constraint) => constraint.fields.length > 0);
  if (table.lifecycle?.field === fieldName) {
    table.lifecycle.field = "";
  }
  for (const other of next.tables) {
    for (const field of other.fields) {
      if (field.relation?.table === tableName && field.relation.field === fieldName) {
        field.relation = null;
      }
    }
  }
  pruneIndexReferences(table);
  return next;
}

/** Devuelve la interfaz de la tabla, creándola cuando falta. */
function ensureTableUI(table: Table): TableUI {
  if (!table.ui) {
    table.ui = {
      maintenance: null,
      navigation: null,
      actions: null,
      default_sort: "",
      available_sorts: [],
    };
  }
  if (!table.ui.available_sorts) {
    table.ui.available_sorts = [];
  }
  return table.ui;
}

/** Quita los órdenes visuales que apuntan a índices que ya no existen. */
function pruneIndexReferences(table: Table): void {
  if (!table.ui) {
    return;
  }
  const names = new Set(table.indexes.map((index) => index.name));
  table.ui.available_sorts = (table.ui.available_sorts ?? []).filter((sort) => names.has(sort.index));
  if (table.ui.default_sort && !names.has(table.ui.default_sort)) {
    table.ui.default_sort = "";
  }
}

/** Agrega un índice nuevo, con el primer campo libre como componente. */
export function addIndex(document: Document, tableName: string): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  const name = uniqueName(`idx_${tableName}_nuevo`, table.indexes.map((index) => index.name));
  const field = table.fields[0];
  table.indexes.push({
    name,
    unique: false,
    fields: field ? [{ name: field.name, order: "asc" }] : [],
  });
  return next;
}

/** Elimina un índice y limpia los órdenes visuales que lo usaban. */
export function removeIndex(document: Document, tableName: string, indexName: string): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  table.indexes = table.indexes.filter((index) => index.name !== indexName);
  pruneIndexReferences(table);
  return next;
}

/** Renombra un índice y actualiza los órdenes visuales que lo referencian. */
export function renameIndex(
  document: Document,
  tableName: string,
  from: string,
  to: string,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table || from === to) {
    return next;
  }
  for (const index of table.indexes) {
    if (index.name === from) {
      index.name = to;
    }
  }
  if (table.ui) {
    for (const sort of ensureTableUI(table).available_sorts) {
      if (sort.index === from) {
        sort.index = to;
      }
    }
    if (table.ui.default_sort === from) {
      table.ui.default_sort = to;
    }
  }
  return next;
}

/** Agrega un campo al índice: el primero que todavía no participa. */
export function addIndexField(document: Document, tableName: string, indexName: string): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  const index = table?.indexes.find((item) => item.name === indexName);
  if (!table || !index) {
    return next;
  }
  const used = new Set(index.fields.map((field) => field.name));
  const candidate = table.fields.find((field) => !used.has(field.name)) ?? table.fields[0];
  if (!candidate) {
    return next;
  }
  index.fields.push({ name: candidate.name, order: "asc" });
  return next;
}

/** Quita un componente del índice. */
export function removeIndexField(
  document: Document,
  tableName: string,
  indexName: string,
  position: number,
): Document {
  const next = cloneDocument(document);
  const index = findTable(next, tableName)?.indexes.find((item) => item.name === indexName);
  if (!index) {
    return next;
  }
  index.fields = index.fields.filter((_, current) => current !== position);
  return next;
}

/** Mueve un componente del índice: el orden importa en índices compuestos. */
export function moveIndexField(
  document: Document,
  tableName: string,
  indexName: string,
  position: number,
  delta: number,
): Document {
  const next = cloneDocument(document);
  const index = findTable(next, tableName)?.indexes.find((item) => item.name === indexName);
  if (!index) {
    return next;
  }
  const target = position + delta;
  if (target < 0 || target >= index.fields.length) {
    return next;
  }
  const [moved] = index.fields.splice(position, 1);
  index.fields.splice(target, 0, moved);
  return next;
}

/** Agrega un orden visual que reutiliza un índice existente. */
export function addAvailableSort(
  document: Document,
  tableName: string,
  indexName: string,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table || !indexName) {
    return next;
  }
  const ui = ensureTableUI(table);
  if (ui.available_sorts.some((sort) => sort.index === indexName)) {
    return next;
  }
  ui.available_sorts.push({ index: indexName, label: null });
  return next;
}

/** Quita un orden visual. */
export function removeAvailableSort(
  document: Document,
  tableName: string,
  position: number,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table || !table.ui) {
    return next;
  }
  table.ui.available_sorts = table.ui.available_sorts.filter((_, current) => current !== position);
  return next;
}

/** Agrega una restricción única con los primeros campos libres. */
export function addUniqueConstraint(document: Document, tableName: string): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  const used = new Set(table.unique_constraints.flatMap((constraint) => constraint.fields));
  const candidates = table.fields.filter((field) => !used.has(field.name)).slice(0, 2);
  table.unique_constraints.push({ fields: candidates.map((field) => field.name) });
  return next;
}

/** Quita una restricción única. */
export function removeUniqueConstraint(
  document: Document,
  tableName: string,
  position: number,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  table.unique_constraints = table.unique_constraints.filter((_, current) => current !== position);
  return next;
}

/** Devuelve una lista con el valor agregado, si no estaba. */
export function addListItem(list: string[], value: string): string[] {
  const trimmed = value.trim();
  if (trimmed === "" || list.includes(trimmed)) {
    return list;
  }
  return [...list, trimmed];
}

/** Devuelve una lista sin el valor indicado. */
export function removeListItem(list: string[], value: string): string[] {
  return list.filter((item) => item !== value);
}

/** Reemplaza el valor de una posición de la lista. */
export function replaceListItem(list: string[], position: number, value: string): string[] {
  return list.map((item, current) => (current === position ? value : item));
}

/** Mueve un campo una posición hacia arriba o hacia abajo. */
export function moveField(
  document: Document,
  tableName: string,
  fieldName: string,
  delta: number,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  const index = table.fields.findIndex((field) => field.name === fieldName);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= table.fields.length) {
    return next;
  }
  const [moved] = table.fields.splice(index, 1);
  table.fields.splice(target, 0, moved);
  return next;
}

/** Renombra un campo y actualiza todas las referencias internas. */
export function renameField(
  document: Document,
  tableName: string,
  from: string,
  to: string,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table || from === to || !table.fields.some((field) => field.name === from)) {
    return next;
  }
  for (const field of table.fields) {
    if (field.name === from) {
      field.name = to;
    }
  }
  table.primary_key = table.primary_key.map((name) => (name === from ? to : name));
  table.display_fields = table.display_fields.map((name) => (name === from ? to : name));
  for (const index of table.indexes) {
    for (const indexField of index.fields) {
      if (indexField.name === from) {
        indexField.name = to;
      }
    }
  }
  for (const constraint of table.unique_constraints) {
    constraint.fields = constraint.fields.map((name) => (name === from ? to : name));
  }
  if (table.lifecycle?.field === from) {
    table.lifecycle.field = to;
  }
  for (const candidate of next.tables) {
    for (const field of candidate.fields) {
      if (field.relation?.table === tableName && field.relation.field === from) {
        field.relation.field = to;
      }
    }
  }
  return next;
}

/** Reemplaza la etiqueta de un idioma en una tabla o un campo. */
export function setEntityLabel(
  document: Document,
  tableName: string,
  fieldName: string | null,
  language: string,
  text: string,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table) {
    return next;
  }
  if (fieldName === null) {
    table.label = setLabel(table.label, language, text);
    return next;
  }
  const field = findField(table, fieldName);
  if (field) {
    field.label = setLabel(field.label, language, text);
  }
  return next;
}

/**
 * Fija una posición de la representación visible de la tabla. Se permiten
 * posiciones vacías mientras se edita: al guardar sólo se persisten nombres
 * válidos, sin repetidos.
 */
export function setDisplayField(
  document: Document,
  tableName: string,
  position: number,
  fieldName: string,
): Document {
  const next = cloneDocument(document);
  const table = findTable(next, tableName);
  if (!table || position < 0 || position >= MAX_DISPLAY_FIELDS) {
    return next;
  }
  const fields = [...table.display_fields];
  while (fields.length < MAX_DISPLAY_FIELDS) {
    fields.push("");
  }
  fields[position] = fieldName;
  table.display_fields = fields;
  return next;
}

/** Dependencias que quedarían rotas si se elimina la tabla. */
export function tableDependencies(document: Document, name: string): string[] {
  const dependencies: string[] = [];
  for (const table of document.tables) {
    for (const field of table.fields) {
      if (field.relation?.table === name) {
        dependencies.push(`${table.name}.${field.name} (relación)`);
      }
    }
  }
  return dependencies;
}

/** Dependencias que quedarían rotas si se elimina el campo. */
export function fieldDependencies(
  document: Document,
  tableName: string,
  fieldName: string,
): string[] {
  const dependencies: string[] = [];
  const table = findTable(document, tableName);
  if (!table) {
    return dependencies;
  }
  if (table.primary_key.includes(fieldName)) {
    dependencies.push("clave primaria de la tabla");
  }
  if (table.display_fields.includes(fieldName)) {
    dependencies.push("display_fields de la tabla");
  }
  for (const index of table.indexes) {
    if (index.fields.some((item) => item.name === fieldName)) {
      dependencies.push(`índice ${index.name}`);
    }
  }
  for (const constraint of table.unique_constraints) {
    if (constraint.fields.includes(fieldName)) {
      dependencies.push("restricción única");
    }
  }
  for (const other of document.tables) {
    for (const field of other.fields) {
      if (field.relation?.table === tableName && field.relation.field === fieldName) {
        dependencies.push(`${other.name}.${field.name} (relación)`);
      }
    }
  }
  return dependencies;
}

/** Título visible de una tabla o un campo, para mensajes y listas. */
export function displayTitle(
  entity: Table | Field,
  defaultLanguage: string,
): string {
  return primaryLabelSafe(entity.label, defaultLanguage) || entity.name;
}

function primaryLabelSafe(label: Table["label"], defaultLanguage: string): string {
  return getLabel(label, defaultLanguage) || getLabel(label, "") || firstLabelValue(label, defaultLanguage);
}

function firstLabelValue(label: Table["label"], defaultLanguage: string): string {
  if (!label?.values) {
    return "";
  }
  const values = Object.values(label.values);
  if (getLabel(label, defaultLanguage)) {
    return getLabel(label, defaultLanguage);
  }
  return values.length > 0 ? values[0] : "";
}

/** Índice válido para listas vacías. */
export { clampIndex };
