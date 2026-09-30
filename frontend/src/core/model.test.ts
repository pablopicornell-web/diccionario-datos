import assert from "node:assert/strict";
import { test } from "node:test";

import { createField, createTable, normalizeDocument } from "./model.ts";
import { sampleDocument } from "./fixtures.ts";

test("normalizeDocument completa listas y no pierde el orden", () => {
  const sparse = sampleDocument();
  delete (sparse.tables[1] as { fields?: unknown }).fields;
  const document = normalizeDocument(sparse);

  assert.deepEqual(document.tables.map((table) => table.name), ["localidades", "usuarios"]);
  assert.deepEqual(document.tables[1].fields, []);
  assert.deepEqual(document.tables[0].unique_constraints, []);
  assert.deepEqual(document.project.languages, ["es", "en"]);
});

test("createField y createTable crean estructuras vacías utilizables", () => {
  const field = createField("nuevo");
  assert.equal(field.name, "nuevo");
  assert.deepEqual(field.allowed_values, []);
  assert.equal(field.label, null);

  const table = createTable("nueva");
  assert.deepEqual(table.fields, []);
  assert.deepEqual(table.primary_key, []);
});
