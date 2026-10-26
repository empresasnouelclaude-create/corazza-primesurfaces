// Pruebas de la lectura de PDF de Citrus (con IA simulada) y de los totales.
import { test } from "node:test";
import assert from "node:assert/strict";
import type Anthropic from "@anthropic-ai/sdk";
import { ESQUEMA_LECTURA, leerPDF } from "./leer.ts";
import { claveDocumento, resumen, saldoDe, unirDocumentos } from "./resumen.ts";
import type { DocumentoGuardado, LecturaPDF } from "./tipos.ts";

function doc(parcial: Partial<DocumentoGuardado>): DocumentoGuardado {
  return {
    id: Math.random().toString(36).slice(2),
    archivo: "x.pdf",
    subido: "2026-10-23T12:00:00Z",
    tipo: "factura",
    numero: null,
    ncf: null,
    fecha: "2026-10-20",
    vencimiento: null,
    cliente: { nombre: "Ana Pérez", rnc: null, telefono: null },
    lineas: [],
    subtotal: null,
    descuento: null,
    itbis: null,
    total: null,
    pagado: null,
    saldo: null,
    moneda: "DOP",
    estado: "desconocido",
    notas: null,
    ...parcial,
  };
}

test("lectura: envía el PDF y la salida estructurada, y devuelve los datos", async () => {
  const esperado: LecturaPDF = { documentos: [], inventario: [], advertencias: ["prueba"] };
  let params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming | null = null;
  const r = await leerPDF({
    pdfBase64: "JVBERi0=",
    nombreArchivo: "factura.pdf",
    crear: async (p) => {
      params = p;
      return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(esperado) }] } as unknown as Anthropic.Beta.BetaMessage;
    },
  });
  assert.deepEqual(r, esperado);
  assert.equal(params!.model, "claude-haiku-5-5");
  assert.equal(params!.output_config?.format?.schema, ESQUEMA_LECTURA);
  const bloque = (params!.messages[0].content as Anthropic.Beta.BetaContentBlockParam[])[0];
  assert.equal(bloque.type, "document");
});

test("lectura: si la IA declina, da un error claro", async () => {
  await assert.rejects(
    leerPDF({
      pdfBase64: "x",
      nombreArchivo: "a.pdf",
      crear: async () => ({ stop_reason: "refusal", content: [] }) as unknown as Anthropic.Beta.BetaMessage,
    }),
    /no pudo leer/,
  );
});

test("clave del documento: por tipo y número, sin distinguir mayúsculas", () => {
  assert.equal(claveDocumento({ tipo: "factura", numero: "fac-0021", ncf: null }), "factura:FAC-0021");
  assert.equal(claveDocumento({ tipo: "factura", numero: null, ncf: "B0100000012" }), "factura:B0100000012");
  assert.equal(claveDocumento({ tipo: "factura", numero: null, ncf: null }), null);
});

test("unir: el reporte de cuentas por cobrar actualiza el saldo sin borrar las líneas", () => {
  const factura = doc({ numero: "F-21", total: 25120, lineas: [{ descripcion: "Isla", cantidad: 23.25, unidad: "ft2", precio_unitario: 800, total: 18600 }] });
  const reporte = doc({ archivo: "cxc.pdf", numero: "F-21", total: 25120, pagado: 12560, saldo: 12560, estado: "parcial", cliente: { nombre: null, rnc: null, telefono: null } });
  const r = unirDocumentos([factura], [reporte]);
  assert.equal(r.length, 1);
  assert.equal(r[0].saldo, 12560);
  assert.equal(r[0].estado, "parcial");
  assert.equal(r[0].lineas.length, 1);
  assert.equal(r[0].cliente.nombre, "Ana Pérez");
  assert.equal(r[0].archivo, "x.pdf");
});

test("unir: documentos sin número siempre se agregan", () => {
  assert.equal(unirDocumentos([doc({})], [doc({})]).length, 2);
});

test("saldo: el del PDF, o total menos pagado, o 0 si está pagada", () => {
  assert.equal(saldoDe(doc({ saldo: 100 })), 100);
  assert.equal(saldoDe(doc({ total: 500, pagado: 200 })), 300);
  assert.equal(saldoDe(doc({ total: 500, estado: "pagada" })), 0);
});

test("resumen: cotizado, facturado, por cobrar y deudores", () => {
  const docs = [
    doc({ tipo: "cotizacion", numero: "C-1", total: 30000 }),
    doc({ tipo: "factura", numero: "F-1", total: 20000, saldo: 0, estado: "pagada" }),
    doc({ tipo: "factura", numero: "F-2", total: 15000, saldo: 7500, cliente: { nombre: "Luis Batista", rnc: null, telefono: null } }),
    doc({ tipo: "factura", numero: "F-3", total: 10000, saldo: 10000, fecha: "2026-09-01" }),
  ];
  const r = resumen(docs, "2026-10-01", "2026-10-31");
  assert.equal(r.cotizado, 30000);
  assert.equal(r.facturado, 35000);
  assert.equal(r.facturas, 2);
  assert.equal(r.cobrado, 27500);
  // Por cobrar incluye la factura de septiembre: es lo que se debe hoy.
  assert.equal(r.porCobrar, 17500);
  assert.deepEqual(r.deudores[0], { cliente: "Ana Pérez", saldo: 10000, facturas: 1 });
});
