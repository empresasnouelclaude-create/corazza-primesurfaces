// Simulador del asistente: corazza.com.do/api/asistente-prueba
// Permite probar conversaciones sin WhatsApp. No guarda nada: el navegador
// envia la conversacion completa en cada mensaje y recibe la actualizada.
// Protegido con la clave ASISTENTE_PRUEBA_CLAVE; sin ella, esta apagado.
import { claveCorrecta } from "@/lib/clave.ts";
import { configuracionIA } from "@/lib/asistente/ia.ts";
import { responder } from "@/lib/asistente/motor.ts";
import { nuevaConversacion, type Conversacion } from "@/lib/asistente/tipos.ts";

const MAX_BYTES = 6_000_000; // conversacion + una foto

export async function POST(request: Request) {
  const cuerpo = await request.text();
  if (cuerpo.length > MAX_BYTES) return Response.json({ error: "Mensaje demasiado grande." }, { status: 413 });

  let datos: { clave?: unknown; conversacion?: Conversacion | null; texto?: string | null; imagen?: unknown };
  try {
    datos = JSON.parse(cuerpo);
  } catch {
    return Response.json({ error: "Formato inválido." }, { status: 400 });
  }
  if (!process.env.ASISTENTE_PRUEBA_CLAVE) {
    return Response.json({ error: "El simulador está apagado (falta ASISTENTE_PRUEBA_CLAVE)." }, { status: 503 });
  }
  if (!claveCorrecta(datos.clave, process.env.ASISTENTE_PRUEBA_CLAVE)) return Response.json({ error: "Clave incorrecta." }, { status: 401 });

  const ia = configuracionIA();
  if (!ia) return Response.json({ error: "Falta configurar ANTHROPIC_API_KEY." }, { status: 503 });

  const imagen = datos.imagen as { base64?: unknown; mime?: unknown } | null | undefined;
  const mimes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
  const mime = mimes.find((m) => m === imagen?.mime);
  const imagenValida = imagen && typeof imagen.base64 === "string" && mime ? { base64: imagen.base64, mime } : null;

  try {
    const resultado = await responder({
      conversacion: datos.conversacion ?? nuevaConversacion("simulador"),
      entrada: { texto: typeof datos.texto === "string" ? datos.texto : null, imagen: imagenValida },
      crear: ia.crear,
      modelo: ia.modelo,
    });
    return Response.json(resultado);
  } catch (error) {
    console.error("Simulador del asistente:", error);
    return Response.json({ error: "La IA no respondió. Intenta de nuevo." }, { status: 502 });
  }
}
