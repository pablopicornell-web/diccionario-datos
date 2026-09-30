import assert from "node:assert/strict";
import { test } from "node:test";

import { describeValue, formatLiteralValue, parseLiteralValue } from "./values.ts";

test("parseLiteralValue respeta el tipo lógico", () => {
  assert.equal(parseLiteralValue("23", "integer"), 23);
  assert.equal(parseLiteralValue("12,5", "decimal"), 12.5);
  assert.equal(parseLiteralValue("true", "boolean"), true);
  assert.equal(parseLiteralValue("false", "boolean"), false);
  assert.equal(parseLiteralValue("M", "string"), "M");
  assert.equal(parseLiteralValue("0", "integer"), 0);
});

test("formatLiteralValue y describeValue muestran los valores del YAML", () => {
  assert.equal(formatLiteralValue(0), "0");
  assert.equal(formatLiteralValue(false), "false");
  assert.equal(formatLiteralValue(null), "");
  assert.equal(describeValue(null), "(sin valor)");
  assert.equal(describeValue(true), "true");
});
