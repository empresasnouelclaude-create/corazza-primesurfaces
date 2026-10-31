// Datos guardados del panel: corazza.com.do/api/panel/datos
// POST { clave }            -> { conectado, datos }  (documentos e inventario)
// POST { clave, pdf: ruta } -> { url }               (enlace temporal al PDF)
// Protegido con la clave PANEL_CLAVE.
import { claveCorrecta } from "@/lib/clave.ts";
import { enlacePDF, leerDatos } from "@/lib/citrus/guardado.ts";
import { baseDeDatos } from "@/lib/supabase.ts";

const RUTA_PDF = /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.pdf$/;

export async function POST(request: Request) {
  if (!process.env.PANEL_CLAVE) return Response.json({ error: "El panel está apagado (falta PANEL_CLAVE)." }, { status: 503 });

  let cuerpo: { clave?: unknown; pdf?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: "Formato inválido." }, { status: 400 });
  }
  if (!claveCorrecta(cuerpo.clave, process.env.PANEL_CLAVE)) return Response.json({ error: "Clave incorrecta." }, { status: 401 });

  const db = baseDeDatos();
  if (!db) return Response.json({ conectado: false, datos: null });

  try {
    if (cuerpo.pdf !== undefined) {
      if (typeof cuerpo.pdf !== "string" || !RUTA_PDF.test(cuerpo.pdf)) return Response.json({ error: "PDF inválido." }, { status: 400 });
      return Response.json({ url: await enlacePDF(db, cuerpo.pdf) });
    }
    return Response.json({ conectado: true, datos: await leerDatos(db) });
  } catch (error) {
    console.error("Datos del panel:", error);
    return Response.json({ error: "No se pudo conectar con la base de datos." }, { status: 502 });
  }
}
