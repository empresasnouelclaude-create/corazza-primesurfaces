// Pruebas de las formulas de "Calcula tu superficie".
// Ejecutar con: npm test   (usa el runner nativo de Node, sin dependencias)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildQuoteMessage,
  circleAreaCm2,
  convertInput,
  evaluateSurface,
  formatArea,
  m2ToFt2,
  parseMeasure,
  toCm,
  validateMeasure,
  type Dimension,
} from "./formulas.ts";

const MAX: Record<Dimension, number> = { largo: 2000, ancho: 500, alto: 400, diametro: 500 };
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("conversion de unidades exacta", () => {
  assert.equal(toCm(1, "in"), 2.54);
  assert.equal(toCm(100, "cm"), 100);
  close(m2ToFt2(1), 10.763910416709722);
  close(m2ToFt2(0.09290304), 1);
});

test("parseMeasure acepta coma o punto y rechaza texto", () => {
  assert.equal(parseMeasure("120,5"), 120.5);
  assert.equal(parseMeasure(" 80.25 "), 80.25);
  assert.equal(parseMeasure(".5"), 0.5);
  assert.equal(parseMeasure(""), null);
  assert.equal(parseMeasure("abc"), null);
  assert.equal(parseMeasure("1.2.3"), null);
  assert.equal(parseMeasure("12cm"), null);
});

test("validateMeasure detecta vacio, invalido, cero, negativo y exceso", () => {
  assert.deepEqual(validateMeasure("", "cm", 500), { ok: false, error: "empty" });
  assert.deepEqual(validateMeasure(undefined, "cm", 500), { ok: false, error: "empty" });
  assert.deepEqual(validateMeasure("x", "cm", 500), { ok: false, error: "invalid" });
  assert.deepEqual(validateMeasure("0", "cm", 500), { ok: false, error: "nonpositive" });
  assert.deepEqual(validateMeasure("-3", "cm", 500), { ok: false, error: "nonpositive" });
  assert.deepEqual(validateMeasure("501", "cm", 500), { ok: false, error: "too-large" });
  // 200 in = 508 cm: supera el limite aunque el numero escrito sea menor
  assert.deepEqual(validateMeasure("200", "in", 500), { ok: false, error: "too-large" });
  assert.deepEqual(validateMeasure("500", "cm", 500), { ok: true, cm: 500 });
});

test("rectangular: 240 x 60 cm = 1.44 m2", () => {
  const r = evaluateSurface("rectangulos", [{ dims: ["largo", "ancho"] }], [{ largo: "240", ancho: "60" }], "cm", MAX);
  assert.equal(r.valid, true);
  close(r.areaM2, 1.44);
  assert.equal(r.pieceCount, 1);
});

test("rectangular en pulgadas: 96 x 25 in = 2400 in2 = 1.548384 m2", () => {
  const r = evaluateSurface("rectangulos", [{ dims: ["largo", "ancho"] }], [{ largo: "96", ancho: "25" }], "in", MAX);
  close(r.areaM2, 1.548384);
  close(m2ToFt2(r.areaM2), 2400 / 144);
});

test("circular: diametro 120 cm = pi x 0.6^2 m2", () => {
  const r = evaluateSurface("circulo", [{ dims: ["diametro"] }], [{ diametro: "120" }], "cm", MAX);
  close(r.areaM2, Math.PI * 0.36);
  close(circleAreaCm2(10), Math.PI * 25);
});

test("salpicadero usa largo x alto", () => {
  const r = evaluateSurface("rectangulos", [{ dims: ["largo", "alto"] }], [{ largo: "300", alto: "55" }], "cm", MAX);
  close(r.areaM2, 1.65);
});

test("L: suma de dos tramos sin solape", () => {
  const specs = [{ dims: ["largo", "ancho"] as Dimension[] }, { dims: ["largo", "ancho"] as Dimension[] }];
  const r = evaluateSurface("rectangulos", specs, [{ largo: "240", ancho: "60" }, { largo: "180", ancho: "60" }], "cm", MAX);
  close(r.areaM2, 1.44 + 1.08);
  assert.equal(r.pieceCount, 2);
});

test("U: suma de tres tramos", () => {
  const d = ["largo", "ancho"] as Dimension[];
  const r = evaluateSurface(
    "rectangulos",
    [{ dims: d }, { dims: d }, { dims: d }],
    [{ largo: "200", ancho: "60" }, { largo: "150,5", ancho: "60" }, { largo: "200", ancho: "60" }],
    "cm",
    MAX,
  );
  close(r.areaM2, 1.2 + 0.903 + 1.2);
  assert.equal(r.pieceCount, 3);
});

test("una medida invalida invalida la superficie y reporta el error", () => {
  const d = ["largo", "ancho"] as Dimension[];
  const r = evaluateSurface("rectangulos", [{ dims: d }, { dims: d }], [{ largo: "240", ancho: "60" }, { largo: "0" }], "cm", MAX);
  assert.equal(r.valid, false);
  assert.equal(r.areaM2, 0);
  assert.deepEqual(r.errors, [{}, { largo: "nonpositive", ancho: "empty" }]);
});

test("sin piezas no es valida", () => {
  assert.equal(evaluateSurface("rectangulos", [], [], "cm", MAX).valid, false);
});

test("convertInput cm <-> pulgadas redondea a 2 decimales y respeta texto invalido", () => {
  assert.equal(convertInput("254", "cm", "in"), "100");
  assert.equal(convertInput("120", "cm", "in"), "47.24");
  assert.equal(convertInput("47,24", "in", "cm"), "119.99");
  assert.equal(convertInput("abc", "cm", "in"), "abc");
  assert.equal(convertInput("10", "cm", "cm"), "10");
});

test("formatArea usa 2 decimales", () => {
  assert.equal(formatArea(2.5), "2.50");
  assert.equal(formatArea(1234.567), "1,234.57");
});

test("mensaje de WhatsApp incluye forma, medidas, unidades, areas y total", () => {
  const msg = buildQuoteMessage(
    [
      { name: "Tope en L", unitLabel: "cm", lines: ["Tramo 1: 240 × 60", "Tramo 2: 180 × 60"], areaM2: 2.52 },
      { name: "Tope circular", unitLabel: "cm", lines: ["Diámetro: 120"], areaM2: 1.13 },
    ],
    { greeting: "Hola", total: "Área total estimada", pieces: "Piezas", note: "Nota" },
    3,
  );
  assert.match(msg, /1\. Tope en L \(cm\)/);
  assert.match(msg, /Tramo 2: 180 × 60/);
  assert.match(msg, /Área: 2\.52 m² \(27\.13 ft²\)/);
  assert.match(msg, /Área total estimada: 3\.65 m² \(39\.29 ft²\)/);
  assert.match(msg, /Piezas: 3/);
});
