// Conexion con la API de WhatsApp de Meta (Cloud API): verificar el
// webhook, comprobar la firma de cada aviso, leer los mensajes entrantes y
// enviar respuestas. Las credenciales salen de variables de entorno (ver
// README, seccion "Asistente de WhatsApp").
import { createHmac, timingSafeEqual } from "node:crypto";

// WHATSAPP_GRAPH_URL solo se usa para pruebas locales con un servidor simulado.
const GRAPH = process.env.WHATSAPP_GRAPH_URL || "https://graph.facebook.com/v23.0";

export type MensajeEntrante = {
  id: string;
  /** Numero de Corazza que recibio el mensaje (phone_number_id de Meta). */
  para: string | null;
  /** Telefono del cliente, formato internacional sin "+". */
  de: string;
  nombrePerfil: string | null;
  tipo: "texto" | "imagen" | "otro";
  texto: string | null;
  mediaId: string | null;
};

/** GET del webhook: Meta envia hub.challenge y espera recibirlo de vuelta. */
export function verificarSuscripcion(params: URLSearchParams, tokenEsperado: string | undefined): string | null {
  if (!tokenEsperado) return null;
  const ok = params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === tokenEsperado;
  return ok ? params.get("hub.challenge") : null;
}

/** Comprueba que el aviso viene de Meta (cabecera X-Hub-Signature-256). */
export function firmaValida(cuerpo: string, cabecera: string | null, secreto: string | undefined): boolean {
  if (!secreto || !cabecera?.startsWith("sha256=")) return false;
  const esperada = Buffer.from(createHmac("sha256", secreto).update(cuerpo, "utf8").digest("hex"), "hex");
  const recibida = Buffer.from(cabecera.slice("sha256=".length), "hex");
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

type CuerpoWebhook = {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: {
          id?: string;
          from?: string;
          type?: string;
          text?: { body?: string };
          image?: { id?: string; caption?: string };
        }[];
        calls?: { id?: string; from?: string; event?: string; direction?: string }[];
        statuses?: { id?: string; status?: string; errors?: { code?: number; title?: string }[] }[];
      };
    }[];
  }[];
};

/** Extrae los mensajes de clientes de un aviso del webhook (ignora estados). */
export function leerMensajes(cuerpo: unknown): MensajeEntrante[] {
  const salida: MensajeEntrante[] = [];
  for (const entrada of (cuerpo as CuerpoWebhook)?.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      const valor = cambio.value;
      const nombres = new Map((valor?.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]));
      for (const m of valor?.messages ?? []) {
        if (!m.id || !m.from) continue;
        const base = { id: m.id, para: valor?.metadata?.phone_number_id ?? null, de: m.from, nombrePerfil: nombres.get(m.from) ?? null };
        if (m.type === "text") salida.push({ ...base, tipo: "texto", texto: m.text?.body ?? "", mediaId: null });
        else if (m.type === "image")
          salida.push({ ...base, tipo: "imagen", texto: m.image?.caption ?? null, mediaId: m.image?.id ?? null });
        else salida.push({ ...base, tipo: "otro", texto: null, mediaId: null });
      }
    }
  }
  return salida;
}

/** Estado de un mensaje enviado (entregado, leido, fallido). */
export type EstadoEnvio = { wamid: string; estado: "enviado" | "entregado" | "leido" | "fallido"; error: string | null };

const ESTADOS: Record<string, EstadoEnvio["estado"]> = { sent: "enviado", delivered: "entregado", read: "leido", failed: "fallido" };

/** Explicacion en español de los errores mas comunes al enviar. */
export function motivoError(codigo: number | undefined, titulo: string | undefined): string {
  if (codigo === FUERA_DE_24_HORAS) return "Pasaron más de 24 horas desde el último mensaje del cliente: hay que usar una plantilla.";
  if (codigo === 131026) return "El número no tiene WhatsApp o no puede recibir el mensaje.";
  return titulo ? `WhatsApp: ${titulo}` : "WhatsApp no pudo entregar el mensaje.";
}

export function leerEstados(cuerpo: unknown): EstadoEnvio[] {
  const salida: EstadoEnvio[] = [];
  for (const entrada of (cuerpo as CuerpoWebhook)?.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      for (const s of cambio.value?.statuses ?? []) {
        const estado = s.status ? ESTADOS[s.status] : undefined;
        if (!s.id || !estado) continue;
        const e = s.errors?.[0];
        salida.push({ wamid: s.id, estado, error: estado === "fallido" ? motivoError(e?.code, e?.title) : null });
      }
    }
  }
  return salida;
}

/** Llamada de WhatsApp entrante (aviso "calls" de Meta). */
export type LlamadaEntrante = { id: string; de: string; para: string | null };

/**
 * Extrae las llamadas que inicia un cliente. Meta avisa al empezar la llamada
 * (event "connect") y al terminar ("terminate"); se toma solo el inicio.
 */
export function leerLlamadas(cuerpo: unknown): LlamadaEntrante[] {
  const salida: LlamadaEntrante[] = [];
  for (const entrada of (cuerpo as CuerpoWebhook)?.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      for (const c of cambio.value?.calls ?? []) {
        if (!c.id || !c.from || c.event !== "connect") continue;
        if (c.direction && c.direction !== "USER_INITIATED") continue;
        salida.push({ id: c.id, de: c.from, para: cambio.value?.metadata?.phone_number_id ?? null });
      }
    }
  }
  return salida;
}

export type CredencialesWhatsApp = { token: string; phoneNumberId: string };

/** Error de la API de WhatsApp, con el codigo de Meta (por ejemplo 131047). */
export class ErrorWhatsApp extends Error {
  codigo: number | null;
  constructor(mensaje: string, codigo: number | null) {
    super(mensaje);
    this.codigo = codigo;
  }
}

/** Codigo de Meta cuando pasaron mas de 24 horas desde el ultimo mensaje del cliente. */
export const FUERA_DE_24_HORAS = 131047;

async function graph(cred: { token: string }, ruta: string, cuerpo?: unknown) {
  const res = await fetch(`${GRAPH}/${ruta}`, {
    method: cuerpo ? "POST" : "GET",
    headers: { Authorization: `Bearer ${cred.token}`, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!res.ok) {
    const texto = await res.text();
    let codigo: number | null = null;
    try {
      codigo = (JSON.parse(texto) as { error?: { code?: number } }).error?.code ?? null;
    } catch {}
    throw new ErrorWhatsApp(`WhatsApp ${ruta}: ${res.status} ${texto}`, codigo);
  }
  return res;
}

/** Id del mensaje que devuelve Meta al enviar (wamid). */
async function idEnviado(res: Response): Promise<string | null> {
  try {
    return ((await res.json()) as { messages?: { id?: string }[] }).messages?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function enviarTexto(cred: CredencialesWhatsApp, para: string, texto: string): Promise<string | null> {
  const res = await graph(cred, `${cred.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to: para,
    type: "text",
    text: { body: texto, preview_url: true },
  });
  return idEnviado(res);
}

export async function enviarImagen(cred: CredencialesWhatsApp, para: string, url: string, pie: string) {
  await graph(cred, `${cred.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to: para,
    type: "image",
    image: { link: url, caption: pie },
  });
}

export async function marcarLeido(cred: CredencialesWhatsApp, mensajeId: string) {
  await graph(cred, `${cred.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: mensajeId,
  });
}

const MIME_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MimeImagen = (typeof MIME_IMAGEN)[number];

/** Descarga una imagen que envio el cliente (dos pasos: URL y archivo). */
export async function descargarImagen(
  cred: CredencialesWhatsApp,
  mediaId: string,
): Promise<{ base64: string; mime: MimeImagen } | null> {
  const meta = (await (await graph(cred, mediaId)).json()) as { url?: string; mime_type?: string };
  const mime = MIME_IMAGEN.find((m) => m === meta.mime_type);
  if (!meta.url || !mime) return null;
  const archivo = await fetch(meta.url, { headers: { Authorization: `Bearer ${cred.token}` } });
  if (!archivo.ok) return null;
  return { base64: Buffer.from(await archivo.arrayBuffer()).toString("base64"), mime };
}

// --- Plantillas (mensajes que inicia la empresa) ---------------------------
// Fuera de las 24 horas desde el ultimo mensaje del cliente, WhatsApp solo
// deja enviar plantillas aprobadas por Meta.

export type Plantilla = {
  nombre: string;
  idioma: string;
  categoria: string;
  /** Texto del cuerpo, con {{1}}, {{2}}… */
  texto: string;
  /** Cuantas variables tiene el cuerpo. */
  variables: number;
  /** false si necesita algo que el panel no llena (variables en el encabezado, imagen, botones con variables). */
  compatible: boolean;
};

type ComponentePlantilla = { type?: string; format?: string; text?: string; buttons?: { url?: string }[] };

export function contarVariables(texto: string): number {
  const numeros = [...texto.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1]));
  return numeros.length ? Math.max(...numeros) : 0;
}

export function leerPlantillas(datos: unknown): Plantilla[] {
  const lista = (datos as { data?: { name?: string; language?: string; status?: string; category?: string; components?: ComponentePlantilla[] }[] })?.data ?? [];
  return lista
    .filter((p) => p.status === "APPROVED" && p.name && p.language)
    .map((p) => {
      const comps = p.components ?? [];
      const cuerpo = comps.find((c) => c.type === "BODY")?.text ?? "";
      const encabezado = comps.find((c) => c.type === "HEADER");
      const botones = comps.find((c) => c.type === "BUTTONS");
      const compatible =
        (!encabezado || (encabezado.format === "TEXT" && contarVariables(encabezado.text ?? "") === 0)) &&
        !(botones?.buttons ?? []).some((b) => contarVariables(b.url ?? "") > 0);
      return { nombre: p.name!, idioma: p.language!, categoria: p.category ?? "", texto: cuerpo, variables: contarVariables(cuerpo), compatible };
    });
}

/** Plantillas aprobadas de la cuenta de WhatsApp Business (WABA). */
export async function listarPlantillas(token: string, wabaId: string): Promise<Plantilla[]> {
  const res = await graph({ token }, `${wabaId}/message_templates?fields=name,language,status,category,components&limit=200`);
  return leerPlantillas(await res.json());
}

export async function enviarPlantilla(
  cred: CredencialesWhatsApp,
  para: string,
  plantilla: { nombre: string; idioma: string },
  variables: string[],
): Promise<string | null> {
  const res = await graph(cred, `${cred.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to: para,
    type: "template",
    template: {
      name: plantilla.nombre,
      language: { code: plantilla.idioma },
      ...(variables.length ? { components: [{ type: "body", parameters: variables.map((text) => ({ type: "text", text })) }] } : {}),
    },
  });
  return idEnviado(res);
}

/**
 * Telefono a formato internacional sin "+". Los numeros dominicanos de 10
 * digitos (809, 829, 849) llevan el 1 delante. Devuelve null si no es valido.
 */
export function normalizarTelefono(texto: string): string | null {
  let d = texto.replace(/\D/g, "");
  if (d.length === 10 && /^(809|829|849)/.test(d)) d = `1${d}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}
