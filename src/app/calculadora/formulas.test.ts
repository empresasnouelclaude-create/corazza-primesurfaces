// Pruebas de aceptacion de la Calculadora Corazza (seccion 10 de la
// especificacion) mas casos limite. Ejecutar con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  areaFt2,
  clampMargin,
  filmFt2,
  format2,
  formatRD,
  ft2ToM2,
  parsePositive,
  quote,
  toFeet,
  totalFt2,
} from "./formulas.ts";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("conversion a pies segun la especificacion", () => {
  close(toFeet(30.48, "cm"), 1);
  close(toFeet(12, "in"), 1);
  close(toFeet(1, "m"), 3.280839895);
  close(toFeet(7, "ft"), 7);
});

test("rectangular 183 x 100 cm ≈ 19.70 ft² y con 10% ≈ 21.67 ft²", () => {
  const a = areaFt2("rectangular", { largo: 183, ancho: 100 }, "cm");
  assert.equal(format2(a), "19.70");
  // La especificacion dice "aproximadamente 21.66": el valor exacto con su
  // formula es 19.69796 x 1.1 = 21.6678, que a 2 decimales es 21.67.
  assert.equal(format2(filmFt2(a, 10)), "21.67");
  close(ft2ToM2(a), 1.83, 1e-12);
});

test("circular diametro 60 cm ≈ 3.04 ft² (no 7.58 ni 12.17)", () => {
  assert.equal(format2(areaFt2("circular", { diametro: 60 }, "cm")), "3.04");
});

test("cuadrada 50 cm ≈ 2.69 ft²", () => {
  assert.equal(format2(areaFt2("cuadrada", { lado: 50 }, "cm")), "2.69");
});

test("todas las unidades dan la misma area para la misma medida fisica", () => {
  const ref = areaFt2("rectangular", { largo: 254, ancho: 76.2 }, "cm");
  close(areaFt2("rectangular", { largo: 100, ancho: 30 }, "in"), ref, 1e-9);
  close(areaFt2("rectangular", { largo: 2.54, ancho: 0.762 }, "m"), ref, 1e-6);
  close(areaFt2("rectangular", { largo: 100 / 12, ancho: 2.5 }, "ft"), ref, 1e-9);
});

test("dos superficies se suman sin redondeo intermedio", () => {
  // 3 superficies de 0.005 ft² cada una: redondeando antes de sumar daria
  // 0.03 (0.01 x 3); sin redondear da 0.015 -> "0.02".
  const tiny = areaFt2("cuadrada", { lado: Math.sqrt(0.005) }, "ft");
  assert.equal(format2(totalFt2([tiny, tiny, tiny])), "0.02");
  const a = areaFt2("rectangular", { largo: 183, ancho: 100 }, "cm");
  const b = areaFt2("circular", { diametro: 60 }, "cm");
  close(totalFt2([a, b]), a + b);
});

test("precio RD$800/ft² para 183 x 100 cm ≈ RD$15,758.36 (sobre area sin redondear, sin margen)", () => {
  const a = areaFt2("rectangular", { largo: 183, ancho: 100 }, "cm");
  // La especificacion dice "aproximadamente RD$15,758.03"; el valor exacto
  // con su formula (19.697956... x 800) es 15,758.36.
  assert.equal(formatRD(quote(a, 800)), "RD$15,758.36");
  // Con el area ya redondeada (19.70 x 800) daria 15,760.00: no es lo que se pide.
  assert.notEqual(formatRD(quote(a, 800)), "RD$15,760.00");
});

test("margen ajustable de 0 a 30", () => {
  assert.equal(clampMargin(-5), 0);
  assert.equal(clampMargin(45), 30);
  assert.equal(clampMargin(Number.NaN), 10);
  close(filmFt2(10, 0), 10);
  close(filmFt2(10, 30), 13);
});

test("validacion: vacio, texto, cero, negativo, infinito y coma decimal", () => {
  assert.deepEqual(parsePositive(""), { ok: false, error: "empty" });
  assert.deepEqual(parsePositive("   "), { ok: false, error: "empty" });
  assert.deepEqual(parsePositive("abc"), { ok: false, error: "invalid" });
  assert.deepEqual(parsePositive("12cm"), { ok: false, error: "invalid" });
  assert.deepEqual(parsePositive("Infinity"), { ok: false, error: "invalid" });
  assert.deepEqual(parsePositive("1e400"), { ok: false, error: "infinite" });
  assert.deepEqual(parsePositive("0"), { ok: false, error: "nonpositive" });
  assert.deepEqual(parsePositive("-3"), { ok: false, error: "nonpositive" });
  assert.deepEqual(parsePositive("183,5"), { ok: true, value: 183.5 });
  assert.deepEqual(parsePositive(" .5 "), { ok: true, value: 0.5 });
});
