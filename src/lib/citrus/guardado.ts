// Guardar y leer los documentos de Citrus en la base de datos (Supabase).
// Los documentos se guardan como JSON; los PDF, en la carpeta privada "citrus".
import type { SupabaseClient } from "@supabase/supabase-js";
import { unirDocumentos } from "./resumen.ts";
import type { DocumentoGuardado, LecturaPDF, ProductoInventario } from "./tipos.ts";

export type DatosPanel = {
  documentos: DocumentoGuardado[];
  inventario: ProductoInventario[];
  inventarioFecha: string | null;
};

const CARPETA = "citrus";

export async function leerDatos(db: SupabaseClient): Promise<DatosPanel> {
  const [docs, inv] = await Promise.all([
    db.from("documentos_citrus").select("datos"),
    db.from("inventario_citrus").select("productos, fecha").eq("id", 1).maybeSingle(),
  ]);
  if (docs.error) throw docs.error;
  if (inv.error) throw inv.error;
  return {
    documentos: (docs.data ?? []).map((f) => f.datos as DocumentoGuardado),
    inventario: (inv.data?.productos as ProductoInventario[] | undefined) ?? [],
    inventarioFecha: inv.data?.fecha ?? null,
  };
}

/**
 * Guarda el PDF y lo leido de el. Si un documento ya existia (mismo tipo y
 * numero) se actualiza, igual que en el navegador. Devuelve todos los datos.
 */
export async function guardarLectura(
  db: SupabaseClient,
  lectura: LecturaPDF,
  archivo: { nombre: string; base64: string },
): Promise<DatosPanel> {
  const subido = new Date().toISOString();
  const ruta = `${subido.slice(0, 10)}/${crypto.randomUUID()}.pdf`;
  const subida = await db.storage
    .from(CARPETA)
    .upload(ruta, Buffer.from(archivo.base64, "base64"), { contentType: "application/pdf" });
  if (subida.error) throw subida.error;

  const actuales = await leerDatos(db);
  const nuevos: DocumentoGuardado[] = lectura.documentos.map((d) => ({
    ...d,
    id: crypto.randomUUID(),
    archivo: archivo.nombre,
    subido,
    pdf: ruta,
  }));
  const documentos = unirDocumentos(actuales.documentos, nuevos);

  // Solo se escriben los documentos nuevos o actualizados.
  const antes = new Map(actuales.documentos.map((d) => [d.id, JSON.stringify(d)]));
  const cambiados = documentos.filter((d) => antes.get(d.id) !== JSON.stringify(d));
  if (cambiados.length) {
    const { error } = await db
      .from("documentos_citrus")
      .upsert(cambiados.map((d) => ({ id: d.id, datos: d, subido: d.subido })));
    if (error) throw error;
  }

  let { inventario, inventarioFecha } = actuales;
  if (lectura.inventario.length) {
    const { error } = await db.from("inventario_citrus").upsert({ id: 1, productos: lectura.inventario, fecha: subido });
    if (error) throw error;
    inventario = lectura.inventario;
    inventarioFecha = subido;
  }
  return { documentos, inventario, inventarioFecha };
}

/** Enlace temporal (10 minutos) para ver un PDF guardado. */
export async function enlacePDF(db: SupabaseClient, ruta: string): Promise<string> {
  const { data, error } = await db.storage.from(CARPETA).createSignedUrl(ruta, 600);
  if (error) throw error;
  return data.signedUrl;
}
