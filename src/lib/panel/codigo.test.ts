import { test } from "node:test";
import assert from "node:assert/strict";
import { coincide, formatoCodigo, leerCodigo } from "./codigo.ts";

test("código de cliente: 4 dígitos desde el 1, y búsqueda por código, nombre o teléfono", () => {
  assert.equal(formatoCodigo(1), "0001");
  assert.equal(formatoCodigo(27), "0027");
  assert.equal(formatoCodigo(12345), "12345");
  assert.equal(formatoCodigo(null), null);
  assert.equal(leerCodigo("#0007"), 7);
  assert.equal(leerCodigo("7"), 7);
  assert.equal(leerCodigo("Ana"), null);
  const c = { codigo: 7, nombre: "Laura Méndez", telefono: "18095550142" };
  assert.ok(coincide("0007", c));
  assert.ok(coincide("#7", c));
  assert.ok(coincide("laura mendez", c));
  assert.ok(coincide("5550142", c));
  assert.ok(!coincide("0008", c));
  assert.ok(coincide("", c));
});
