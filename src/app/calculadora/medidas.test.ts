import { test } from "node:test";
import assert from "node:assert/strict";
import { leerMedidas, leerSuperficies } from "./medidas.ts";

test("medidas de WhatsApp: rectangular, cuadrada, redonda y unidades", () => {
  assert.deepEqual(leerMedidas("60 x 30 pulgadas"), { shape: "rectangular", unit: "in", dims: { largo: "60", ancho: "30" } });
  assert.deepEqual(leerMedidas("240x90 cm"), { shape: "rectangular", unit: "cm", dims: { largo: "240", ancho: "90" } });
  assert.deepEqual(leerMedidas("1,20 por 0,80 metros"), { shape: "rectangular", unit: "m", dims: { largo: "1.20", ancho: "0.80" } });
  assert.deepEqual(leerMedidas("comedor 50 x 25 in; centro 10 x 40 in"), { shape: "rectangular", unit: "in", dims: { largo: "50", ancho: "25" } });
  assert.deepEqual(leerMedidas("90 x 90"), { shape: "cuadrada", unit: null, dims: { lado: "90" } });
  assert.deepEqual(leerMedidas("redonda de 120 cm de diámetro"), { shape: "circular", unit: "cm", dims: { diametro: "120" } });
  assert.equal(leerMedidas("no sé"), null);
  assert.equal(leerMedidas(null), null);
});

test("varias superficies de la ficha, con descripcion y unidad compartida", () => {
  const l = leerSuperficies("comedor 50 x 25; centro 10 x 40 in", "mesas");
  assert.deepEqual(l.map((x) => [x.description, x.unit, x.dims]), [
    ["comedor", "in", { largo: "50", ancho: "25" }],
    ["centro", "in", { largo: "10", ancho: "40" }],
  ]);
  assert.equal(leerSuperficies("60 x 30 cm", "mesa de centro")[0].description, "mesa de centro");
  assert.deepEqual(leerSuperficies(null, "x"), []);
});
