// Lectura de PDF de Citrus para el panel: corazza.com.do/api/panel/citrus
// Recibe un PDF (en base64), lo lee con la IA y, si la base de datos esta
// conectada, guarda el PDF y los datos y devuelve todo lo guardado
// ({ lectura, datos }). Sin base de datos devuelve solo la lectura y el panel
// la guarda en el navegador (modo de prueba).
// Protegido con la clave PANEL_CLAVE.
import Anthropic from "@anthropic-ai/sdk";
import { claveCorrecta } from "@/lib/clave.ts";
import { guardarLectura } from "@/lib/citrus/guardado.ts";
import { MODELO_LECTURA, leerPDF } from "@/lib/citrus/leer.ts";
import { baseDeDatos } from "@/lib/supabase.ts";

// Vercel acepta hasta ~4.5 MB por peticion; un PDF de 3 MB ocupa ~4 MB en base64.
const MAX_BASE64 = 4_200_000;

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.PANEL_CLAVE) return Response.json({ error: "El panel está apagado (falta PANEL_CLAVE)." }, { status: 503 });
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "Falta configurar ANTHROPIC_API_KEY." }, { status: 503 });

  let datos: { clave?: unknown; pdf?: unknown; nombre?: unknown };
  try {
    datos = await request.json();
  } catch {
    return Response.json({ error: "Formato inválido." }, { status: 400 });
  }
  if (!claveCorrecta(datos.clave, process.env.PANEL_CLAVE)) return Response.json({ error: "Clave incorrecta." }, { status: 401 });
  if (typeof datos.pdf !== "string" || !datos.pdf) return Response.json({ error: "Falta el PDF." }, { status: 400 });
  if (datos.pdf.length > MAX_BASE64) return Response.json({ error: "El PDF pesa más de 3 MB." }, { status: 413 });

  const client = new Anthropic();
  const nombre = typeof datos.nombre === "string" ? datos.nombre.slice(0, 120) : "documento.pdf";
  let lectura;
  try {
    lectura = await leerPDF({
      pdfBase64: datos.pdf,
      nombreArchivo: nombre,
      crear: (params) => client.beta.messages.create(params),
      modelo: process.env.CITRUS_MODELO || MODELO_LECTURA,
    });
  } catch (error) {
    console.error("Lectura de PDF de Citrus:", error);
    const mensaje = error instanceof Error && !(error instanceof Anthropic.APIError) ? error.message : "No se pudo leer el PDF. Intenta de nuevo.";
    return Response.json({ error: mensaje }, { status: 502 });
  }

  const db = baseDeDatos();
  if (!db) return Response.json({ lectura, datos: null });
  try {
    return Response.json({ lectura, datos: await guardarLectura(db, lectura, { nombre, base64: datos.pdf }) });
  } catch (error) {
    console.error("Guardar PDF de Citrus:", error);
    return Response.json({ error: "Se leyó el PDF pero no se pudo guardar. Intenta de nuevo." }, { status: 502 });
  }
}
