// Pruebas del guardado en la base de datos con un Supabase simulado.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { guardarLectura, leerDatos } from "./guardado.ts";
import type { DocumentoCitrus, LecturaPDF } from "./tipos.ts";

/** Supabase en memoria con solo lo que usa guardado.ts. */
function supabaseFalso() {
  const tablas: Record<string, Map<unknown, Record<string, unknown>>> = {
    documentos_citrus: new Map(),
    inventario_citrus: new Map(),
  };
  const archivos = new Map<string, Buffer>();
  const db = {
    from(tabla: string) {
      const filas = tablas[tabla];
      return {
        select() {
          const todas = Promise.resolve({ data: [...filas.values()], error: null });
          return Object.assign(todas, {
            eq: (_c: string, v: unknown) => ({ maybeSingle: async () => ({ data: filas.get(v) ?? null, error: null }) }),
          });
        },
        async upsert(datos: Record<string, unknown> | Record<string, unknown>[]) {
          for (const f of [datos].flat()) filas.set(f.id, f);
          return { error: null };
        },
      };
    },
    storage: {
      from: () => ({
        async upload(ruta: string, contenido: Buffer) {
          archivos.set(ruta, contenido);
          return { data: { path: ruta }, error: null };
        },
      }),
    },
  };
  return { db: db as unknown as SupabaseClient, tablas, archivos };
}

const factura = (p: Partial<DocumentoCitrus>): DocumentoCitrus => ({
  tipo: "factura", numero: "F-1", ncf: null, fecha: "2026-10-20", vencimiento: null,
  cliente: { nombre: "Ana", rnc: null, telefono: null }, lineas: [], subtotal: null, descuento: null,
  itbis: null, total: 1000, pagado: 0, saldo: 1000, moneda: "DOP", estado: "pendiente", notas: null, ...p,
});

test("guarda el PDF y los documentos, y actualiza el saldo con un reporte nuevo", async () => {
  const { db, tablas, archivos } = supabaseFalso();
  const pdf = { nombre: "f1.pdf", base64: Buffer.from("%PDF-1").toString("base64") };

  const l1: LecturaPDF = { documentos: [factura({})], inventario: [], advertencias: [] };
  const d1 = await guardarLectura(db, l1, pdf);
  assert.equal(d1.documentos.length, 1);
  assert.equal(archivos.size, 1);
  const primero = d1.documentos[0];
  assert.match(primero.pdf!, /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.pdf$/);

  const l2: LecturaPDF = {
    documentos: [factura({ pagado: 1000, saldo: 0, estado: "pagada", total: null })],
    inventario: [{ producto: "Lámina", codigo: null, cantidad: 3, unidad: "rollos", costo: null }],
    advertencias: [],
  };
  const d2 = await guardarLectura(db, l2, { nombre: "cxc.pdf", base64: pdf.base64 });
  assert.equal(d2.documentos.length, 1, "no duplica la factura");
  assert.equal(d2.documentos[0].saldo, 0);
  assert.equal(d2.documentos[0].total, 1000, "conserva el total anterior");
  assert.equal(d2.documentos[0].pdf, primero.pdf, "conserva el PDF original");
  assert.equal(tablas.documentos_citrus.size, 1);

  const leidos = await leerDatos(db);
  assert.equal(leidos.documentos[0].estado, "pagada");
  assert.equal(leidos.inventario.length, 1);
  assert.ok(leidos.inventarioFecha);
});
