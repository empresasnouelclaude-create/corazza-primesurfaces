// Pruebas del flujo de la Calculadora Corazza (reducer). Ejecutar con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, reducer, totals, type Action, type State } from "./state.ts";

const run = (actions: Action[], from: State = initialState()) => actions.reduce(reducer, from);
const DATE = new Date("2026-10-13T12:00:00");

test("estado inicial: rectangular, centimetros, margen 10%, sin superficies", () => {
  const s = initialState();
  assert.equal(s.shape, "rectangular");
  assert.equal(s.unit, "cm");
  assert.equal(s.margin, 10);
  assert.equal(s.items.length, 0);
});

test("agregar medida limpia descripcion y medidas pero conserva forma y unidad", () => {
  const s = run([
    { type: "shape", value: "circular" },
    { type: "unit", value: "in" },
    { type: "description", value: "Mesa redonda" },
    { type: "dim", dim: "diametro", value: "40" },
    { type: "add" },
  ]);
  assert.equal(s.items.length, 1);
  assert.equal(s.items[0].description, "Mesa redonda");
  assert.equal(s.description, "");
  assert.deepEqual(s.dimInputs, {});
  assert.equal(s.shape, "circular");
  assert.equal(s.unit, "in");
});

test("medidas invalidas no se agregan y muestran el error", () => {
  const s = run([{ type: "dim", dim: "largo", value: "0" }, { type: "add" }]);
  assert.equal(s.items.length, 0);
  assert.deepEqual(s.dimErrors, { largo: "nonpositive", ancho: "empty" });
});

test("sin descripcion se nombra 'Superficie N'", () => {
  const s = run([
    { type: "dim", dim: "largo", value: "183" },
    { type: "dim", dim: "ancho", value: "100" },
    { type: "add" },
  ]);
  assert.equal(s.items[0].description, "Superficie 1");
});

test("dos superficies se suman; precio y film segun la especificacion", () => {
  const s = run([
    { type: "description", value: "Mesa comedor" },
    { type: "dim", dim: "largo", value: "183" },
    { type: "dim", dim: "ancho", value: "100" },
    { type: "add" },
    { type: "shape", value: "cuadrada" },
    { type: "dim", dim: "lado", value: "50" },
    { type: "add" },
    { type: "price", value: "800" },
  ]);
  const t = totals(s);
  assert.equal(t.totalFt2.toFixed(4), (19.697956 + 2.690978).toFixed(4));
  assert.equal(t.filmFt2.toFixed(4), ((19.697956 + 2.690978) * 1.1).toFixed(4));
  assert.equal(t.quote?.toFixed(2), ((19.6979560626 + 2.6909776042) * 1.1 * 800).toFixed(2));
});

test("eliminar una superficie y borrar todas", () => {
  let s = run([
    { type: "dim", dim: "largo", value: "100" },
    { type: "dim", dim: "ancho", value: "50" },
    { type: "add" },
    { type: "dim", dim: "largo", value: "80" },
    { type: "dim", dim: "ancho", value: "40" },
    { type: "add" },
  ]);
  s = reducer(s, { type: "remove", id: s.items[0].id });
  assert.equal(s.items.length, 1);
  assert.equal(s.items[0].description, "Superficie 2");
  s = reducer(s, { type: "clearItems" });
  assert.equal(s.items.length, 0);
});

test("reporte: deshabilitado sin superficies; se invalida al editar datos", () => {
  assert.equal(run([{ type: "generate", date: DATE }]).report, null);
  let s = run([
    { type: "client", value: "Ana Pérez" },
    { type: "dim", dim: "largo", value: "183" },
    { type: "dim", dim: "ancho", value: "100" },
    { type: "add" },
    { type: "generate", date: DATE },
  ]);
  assert.equal(s.report?.client, "Ana Pérez");
  assert.equal(s.report?.items.length, 1);
  assert.equal(s.report?.quote, null); // sin precio no hay cotizacion
  // Escribir la proxima medida no invalida el reporte...
  s = reducer(s, { type: "dim", dim: "largo", value: "50" });
  assert.ok(s.report);
  // ...y cambiar el margen o el precio lo actualiza solo (misma fecha).
  s = reducer(s, { type: "price", value: "800" });
  const conDiez = s.report?.quote ?? 0;
  s = reducer(s, { type: "margin", value: 15 });
  assert.ok(s.report);
  assert.equal(s.report?.date, DATE);
  assert.equal(s.report?.margin, 15);
  assert.ok((s.report?.quote ?? 0) > conDiez, "la cotizacion sube con el margen");
  // Si se borran todas las medidas, el reporte se oculta.
  s = reducer(s, { type: "clearItems" });
  assert.equal(s.report, null);
  assert.equal(s.reportStale, true);
});

test("reset: cero superficies, cliente vacio, centimetros y 10%", () => {
  const s = run([
    { type: "client", value: "Cliente X" },
    { type: "unit", value: "m" },
    { type: "shape", value: "cuadrada" },
    { type: "margin", value: 25 },
    { type: "price", value: "900" },
    { type: "dim", dim: "lado", value: "1" },
    { type: "add" },
    { type: "generate", date: DATE },
    { type: "reset" },
  ]);
  assert.equal(s.items.length, 0);
  assert.equal(s.client, "");
  assert.equal(s.unit, "cm");
  assert.equal(s.shape, "rectangular");
  assert.equal(s.margin, 10);
  assert.equal(s.priceInput, "");
  assert.equal(s.report, null);
});
