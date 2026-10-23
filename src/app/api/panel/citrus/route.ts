// Lectura de PDF de Citrus para el panel: corazza.com.do/api/panel/citrus
// Recibe un PDF (en base64) y devuelve los datos leidos. No guarda nada:
// hasta conectar la base de datos, el panel guarda los datos en el navegador.
// Protegido con la clave PANEL_CLAVE.
import Anthropic from "@anthropic-ai/sdk";
import { claveCorrecta } from "@/lib/clave.ts";
import { MODELO_LECTURA, leerPDF } from "@/lib/citrus/leer.ts";

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
  try {
    const lectura = await leerPDF({
      pdfBase64: datos.pdf,
      nombreArchivo: typeof datos.nombre === "string" ? datos.nombre.slice(0, 120) : "documento.pdf",
      crear: (params) => client.beta.messages.create(params),
      modelo: process.env.CITRUS_MODELO || MODELO_LECTURA,
    });
    return Response.json(lectura);
  } catch (error) {
    console.error("Lectura de PDF de Citrus:", error);
    const mensaje = error instanceof Error && !(error instanceof Anthropic.APIError) ? error.message : "No se pudo leer el PDF. Intenta de nuevo.";
    return Response.json({ error: mensaje }, { status: 502 });
  }
}
