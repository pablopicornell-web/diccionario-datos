import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addField,
  addAvailableSort,
  addIndex,
  addIndexField,
  addListItem,
  addTable,
  addUniqueConstraint,
  fieldDependencies,
  moveIndexField,
  moveField,
  moveTable,
  removeAvailableSort,
  removeField,
  removeIndex,
  removeIndexField,
  removeListItem,
  removeTable,
  removeUniqueConstraint,
  renameField,
  renameIndex,
  renameTable,
  replaceListItem,
  setDisplayField,
  tableDependencies,
  uniqueName,
} from "./edits.ts";
import { sampleDocument } from "./fixtures.ts";

test("renameTable actualiza las relaciones que apuntan a la tabla", () => {
  const document = renameTable(sampleDocument(), "localidades", "ciudades");
  const relation = document.tables[1].fields[1].relation;
  assert.equal(document.tables[0].name, "ciudades");
  assert.equal(relation?.table, "ciudades");
});

test("renameField actualiza todas las referencias internas", () => {
  const base = sampleDocument();
  base.tables[0].indexes = [{ name: "idx_nombre", fields: [{ name: "nombre", order: "asc" }] }];
  base.tables[0].unique_constraints = [{ fields: ["nombre"] }];
  base.tables[0].ui = { maintenance: null, navigation: null, actions: null, default_sort: "idx_nombre", available_sorts: [] };

  const document = renameField(base, "localidades", "nombre", "descripcion");
  const table = document.tables[0];
  assert.equal(table.fields[1].name, "descripcion");
  assert.deepEqual(table.display_fields, ["descripcion"]);
  assert.deepEqual(table.indexes[0].fields[0].name, "descripcion");
  assert.deepEqual(table.unique_constraints[0].fields, ["descripcion"]);
  assert.equal(table.ui?.default_sort, "idx_nombre");
});

test("renameField actualiza la relación que apunta al campo renombrado", () => {
  const document = renameField(sampleDocument(), "localidades", "id", "codigo");
  const usuarios = document.tables[1];
  assert.equal(usuarios.fields[1].relation?.field, "codigo");
  assert.deepEqual(document.tables[0].primary_key, ["codigo"]);
});

test("moveTable y moveField conservan el orden esperado", () => {
  const moved = moveTable(sampleDocument(), "usuarios", -1);
  assert.deepEqual(moved.tables.map((table) => table.name), ["usuarios", "localidades"]);

  const fields = moveField(sampleDocument(), "usuarios", "localidad_id", -1);
  assert.deepEqual(fields.tables[1].fields.map((field) => field.name), ["localidad_id", "id"]);

  const clamped = moveTable(sampleDocument(), "usuarios", 5);
  assert.deepEqual(clamped.tables.map((table) => table.name), ["localidades", "usuarios"]);
});

test("addTable y addField generan nombres libres", () => {
  const withTable = addTable(sampleDocument(), "localidades");
  assert.equal(withTable.tables[2].name, "localidades_2");
  assert.deepEqual(withTable.tables[2].primary_key, ["id"]);

  const withField = addField(sampleDocument(), "usuarios", "id");
  assert.equal(withField.tables[1].fields[2].name, "id_2");
});

test("removeTable limpia las relaciones que la usaban", () => {
  const document = removeTable(sampleDocument(), "localidades");
  assert.equal(document.tables.length, 1);
  assert.equal(document.tables[0].fields[1].relation, null);
});

test("removeField limpia clave, índices, restricciones y relaciones", () => {
  const base = sampleDocument();
  base.tables[0].indexes = [{ name: "idx_nombre", fields: [{ name: "nombre", order: "asc" }] }];
  base.tables[0].unique_constraints = [{ fields: ["nombre"] }];
  const document = removeField(base, "localidades", "nombre");
  const table = document.tables[0];

  assert.deepEqual(table.fields.map((field) => field.name), ["id"]);
  assert.deepEqual(table.display_fields, []);
  assert.deepEqual(table.indexes, []);
  assert.deepEqual(table.unique_constraints, []);
});

test("las dependencias se informan antes de eliminar", () => {
  const document = sampleDocument();
  assert.deepEqual(tableDependencies(document, "localidades"), ["usuarios.localidad_id (relación)"]);
  assert.deepEqual(fieldDependencies(document, "localidades", "id"), [
    "clave primaria de la tabla",
    "usuarios.localidad_id (relación)",
  ]);
  assert.deepEqual(fieldDependencies(document, "usuarios", "id"), ["clave primaria de la tabla"]);
});

test("uniqueName evita colisiones", () => {
  assert.equal(uniqueName("campo", ["campo"]), "campo_2");
  assert.equal(uniqueName("campo", ["campo", "campo_2"]), "campo_3");
  assert.equal(uniqueName("campo", ["otro"]), "campo");
});

test("addIndex crea un índice con el primer campo y nombre libre", () => {
  let document = sampleDocument();
  document = addIndex(document, "usuarios");
  const index = document.tables[1].indexes[0];
  assert.equal(index.name, "idx_usuarios_nuevo");
  assert.deepEqual(index.fields, [{ name: "id", order: "asc" }]);
  assert.equal(index.unique, false);
});

test("addIndexField usa el primer campo que todavía no participa", () => {
  const document = addIndexField(
    addIndex(sampleDocument(), "usuarios"),
    "usuarios",
    "idx_usuarios_nuevo",
  );
  assert.deepEqual(
    document.tables[1].indexes[0].fields.map((field) => field.name),
    ["id", "localidad_id"],
  );
});

test("moveIndexField y removeIndexField respetan el orden de los componentes", () => {
  const base = addIndexField(addIndex(sampleDocument(), "usuarios"), "usuarios", "idx_usuarios_nuevo");
  const moved = moveIndexField(base, "usuarios", "idx_usuarios_nuevo", 1, -1);
  assert.deepEqual(
    moved.tables[1].indexes[0].fields.map((field) => field.name),
    ["localidad_id", "id"],
  );
  const trimmed = removeIndexField(base, "usuarios", "idx_usuarios_nuevo", 0);
  assert.deepEqual(
    trimmed.tables[1].indexes[0].fields.map((field) => field.name),
    ["localidad_id"],
  );
});

test("renameIndex y removeIndex mantienen coherentes los órdenes visuales", () => {
  let document = addIndex(sampleDocument(), "usuarios");
  document = addAvailableSort(document, "usuarios", "idx_usuarios_nuevo");
  document.tables[1].ui!.default_sort = "idx_usuarios_nuevo";

  const renamed = renameIndex(document, "usuarios", "idx_usuarios_nuevo", "idx_usuarios_orden");
  assert.equal(renamed.tables[1].ui!.default_sort, "idx_usuarios_orden");
  assert.equal(renamed.tables[1].ui!.available_sorts[0].index, "idx_usuarios_orden");

  const removed = removeIndex(renamed, "usuarios", "idx_usuarios_orden");
  assert.deepEqual(removed.tables[1].indexes, []);
  assert.equal(removed.tables[1].ui!.default_sort, "");
  assert.deepEqual(removed.tables[1].ui!.available_sorts, []);
});

test("removeField limpia el índice vacío y su orden visual", () => {
  let document = addIndex(sampleDocument(), "localidades");
  document = renameIndex(document, "localidades", "idx_localidades_nuevo", "idx_localidades_id");
  document = addAvailableSort(document, "localidades", "idx_localidades_id");

  const withoutField = removeField(document, "localidades", "id");
  assert.deepEqual(withoutField.tables[0].indexes, []);
  assert.deepEqual(withoutField.tables[0].ui!.available_sorts, []);
});

test("addAvailableSort no duplica y removeAvailableSort quita la posición", () => {
  let document = addIndex(sampleDocument(), "usuarios");
  document = addAvailableSort(document, "usuarios", "idx_usuarios_nuevo");
  document = addAvailableSort(document, "usuarios", "idx_usuarios_nuevo");
  assert.equal(document.tables[1].ui!.available_sorts.length, 1);

  const removed = removeAvailableSort(document, "usuarios", 0);
  assert.deepEqual(removed.tables[1].ui!.available_sorts, []);
});

test("las restricciones únicas compuestas se agregan y se quitan", () => {
  const document = addUniqueConstraint(sampleDocument(), "usuarios");
  assert.deepEqual(document.tables[1].unique_constraints, [{ fields: ["id", "localidad_id"] }]);

  const cleaned = removeUniqueConstraint(document, "usuarios", 0);
  assert.deepEqual(cleaned.tables[1].unique_constraints, []);
});

test("los ayudantes de listas no duplican ni dejan valores vacíos", () => {
  assert.deepEqual(addListItem(["es"], "en"), ["es", "en"]);
  assert.deepEqual(addListItem(["es"], "es"), ["es"]);
  assert.deepEqual(addListItem(["es"], "   "), ["es"]);
  assert.deepEqual(removeListItem(["es", "en"], "en"), ["es"]);
  assert.deepEqual(replaceListItem(["es", "en"], 1, "pt"), ["es", "pt"]);
});

test("setDisplayField completa posiciones y conserva el orden elegido", () => {
  let document = sampleDocument();
  document = setDisplayField(document, "localidades", 0, "nombre");
  document = setDisplayField(document, "localidades", 1, "id");
  const fields = document.tables[0].display_fields;
  assert.equal(fields[0], "nombre");
  assert.equal(fields[1], "id");
  assert.equal(fields.length, 5);
  assert.equal(fields[4], "");
});

test("renameField y removeField mantienen display_fields coherente", () => {
  const renamed = renameField(sampleDocument(), "localidades", "nombre", "denominacion");
  assert.deepEqual(renamed.tables[0].display_fields, ["denominacion"]);

  const removed = removeField(sampleDocument(), "localidades", "nombre");
  assert.deepEqual(removed.tables[0].display_fields, []);
});

test("las dependencias informan el uso en display_fields", () => {
  const document = sampleDocument();
  assert.deepEqual(fieldDependencies(document, "localidades", "nombre"), [
    "display_fields de la tabla",
  ]);
});
