// Herramienta "WhatsApp" del panel: corazza.com.do/api/panel/whatsapp
// Escribir a un cliente desde cualquiera de los numeros conectados (Corazza,
// Flota 1…). Protegido con la clave PANEL_CLAVE.
//
// POST { clave, accion: "estado" }     -> numeros y si estan conectados
// POST { clave, accion: "plantillas" } -> plantillas aprobadas por Meta
// POST { clave, accion: "historial" }  -> ultimos mensajes enviados
// POST { clave, accion: "enviar", remitente, para, nombre?, tipo: "texto", texto }
// POST { clave, accion: "enviar", remitente, para, nombre?, tipo: "plantilla", plantilla: { nombre, idioma }, variables }
import { claveCorrecta } from "@/lib/clave.ts";
import {
  ErrorWhatsApp,
  FUERA_DE_24_HORAS,
  enviarPlantilla,
  enviarTexto,
  listarPlantillas,
  normalizarTelefono,
} from "@/lib/asistente/whatsapp.ts";
import { REMITENTES, idNumero } from "@/lib/panel/remitentes.ts";
import { baseDeDatos } from "@/lib/supabase.ts";

type Cuerpo = {
  clave?: unknown;
  accion?: unknown;
  remitente?: unknown;
  para?: unknown;
  nombre?: unknown;
  tipo?: unknown;
  texto?: unknown;
  plantilla?: { nombre?: unknown; idioma?: unknown };
  variables?: unknown;
};

const error = (mensaje: string, status: number) => Response.json({ error: mensaje }, { status });
const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  if (!process.env.PANEL_CLAVE) return error("El panel está apagado (falta PANEL_CLAVE).", 503);
  let c: Cuerpo;
  try {
    c = await request.json();
  } catch {
    return error("Formato inválido.", 400);
  }
  if (!claveCorrecta(c.clave, process.env.PANEL_CLAVE)) return error("Clave incorrecta.", 401);

  const token = process.env.WHATSAPP_TOKEN?.trim() || null;
  const wabaId = process.env.WHATSAPP_WABA_ID?.trim() || null;
  const db = baseDeDatos();

  if (c.accion === "estado") {
    return Response.json({
      token: Boolean(token),
      plantillas: Boolean(token && wabaId),
      historial: Boolean(db),
      remitentes: REMITENTES.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        descripcion: r.descripcion,
        variable: r.variable,
        conectado: Boolean(token && idNumero(r)),
      })),
    });
  }

  if (c.accion === "plantillas") {
    if (!token || !wabaId) return error("Faltan WHATSAPP_TOKEN o WHATSAPP_WABA_ID.", 503);
    try {
      return Response.json({ plantillas: await listarPlantillas(token, wabaId) });
    } catch (e) {
      console.error("Plantillas de WhatsApp:", e);
      return error("No se pudieron cargar las plantillas de Meta.", 502);
    }
  }

  if (c.accion === "historial") {
    if (!db) return Response.json({ envios: [] });
    const { data, error: e } = await db.from("envios_whatsapp").select("*").order("creado", { ascending: false }).limit(50);
    if (e) return error("No se pudo leer el historial.", 502);
    return Response.json({ envios: data });
  }

  if (c.accion !== "enviar") return error("Acción inválida.", 400);

  const remitente = REMITENTES.find((r) => r.id === c.remitente);
  if (!remitente) return error("Número de envío inválido.", 400);
  const phoneNumberId = idNumero(remitente);
  if (!token || !phoneNumberId) return error(`${remitente.nombre} todavía no está conectado.`, 503);
  const para = normalizarTelefono(texto(c.para, 30));
  if (!para) return error("El teléfono del cliente no es válido.", 400);
  const nombre = texto(c.nombre, 80) || null;
  const cred = { token, phoneNumberId };

  let contenido: string;
  let wamid: string | null;
  try {
    if (c.tipo === "texto") {
      contenido = texto(c.texto, 4000);
      if (!contenido) return error("Escribe el mensaje.", 400);
      wamid = await enviarTexto(cred, para, contenido);
    } else if (c.tipo === "plantilla") {
      const nombrePlantilla = texto(c.plantilla?.nombre, 512);
      const idioma = texto(c.plantilla?.idioma, 20);
      const variables = Array.isArray(c.variables) ? c.variables.map((v) => texto(v, 1000)) : [];
      if (!nombrePlantilla || !idioma) return error("Elige una plantilla.", 400);
      if (variables.some((v) => !v)) return error("Completa todos los datos de la plantilla.", 400);
      wamid = await enviarPlantilla(cred, para, { nombre: nombrePlantilla, idioma }, variables);
      contenido = variables.length ? `${nombrePlantilla} (${variables.join(" · ")})` : nombrePlantilla;
    } else {
      return error("Tipo de mensaje inválido.", 400);
    }
  } catch (e) {
    if (e instanceof ErrorWhatsApp && e.codigo === FUERA_DE_24_HORAS) {
      return error(
        "Este cliente no ha escrito a ese número en las últimas 24 horas. WhatsApp solo deja iniciar la conversación con una plantilla aprobada.",
        409,
      );
    }
    console.error("Envío de WhatsApp desde el panel:", e);
    return error("WhatsApp no aceptó el mensaje. Revisa el número e intenta de nuevo.", 502);
  }

  if (db) {
    const { error: e } = await db
      .from("envios_whatsapp")
      .insert({ remitente: remitente.id, para, nombre, tipo: c.tipo, contenido, wamid });
    if (e) console.error("Historial de WhatsApp:", e);
  }
  return Response.json({ ok: true, para });
}
