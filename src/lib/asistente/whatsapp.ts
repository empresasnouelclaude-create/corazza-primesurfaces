// Conexion con la API de WhatsApp de Meta (Cloud API): verificar el
// webhook, comprobar la firma de cada aviso, leer los mensajes entrantes y
// enviar respuestas. Las credenciales salen de variables de entorno (ver
// README, seccion "Asistente de WhatsApp").
import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = "https://graph.facebook.com/v23.0";

export type MensajeEntrante = {
  id: string;
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
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: {
          id?: string;
          from?: string;
          type?: string;
          text?: { body?: string };
          image?: { id?: string; caption?: string };
        }[];
        calls?: { id?: string; from?: string; event?: string; direction?: string }[];
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
        const base = { id: m.id, de: m.from, nombrePerfil: nombres.get(m.from) ?? null };
        if (m.type === "text") salida.push({ ...base, tipo: "texto", texto: m.text?.body ?? "", mediaId: null });
        else if (m.type === "image")
          salida.push({ ...base, tipo: "imagen", texto: m.image?.caption ?? null, mediaId: m.image?.id ?? null });
        else salida.push({ ...base, tipo: "otro", texto: null, mediaId: null });
      }
    }
  }
  return salida;
}

/** Llamada de WhatsApp entrante (aviso "calls" de Meta). */
export type LlamadaEntrante = { id: string; de: string };

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
        salida.push({ id: c.id, de: c.from });
      }
    }
  }
  return salida;
}

export type CredencialesWhatsApp = { token: string; phoneNumberId: string };

async function graph(cred: CredencialesWhatsApp, ruta: string, cuerpo?: unknown) {
  const res = await fetch(`${GRAPH}/${ruta}`, {
    method: cuerpo ? "POST" : "GET",
    headers: { Authorization: `Bearer ${cred.token}`, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!res.ok) throw new Error(`WhatsApp ${ruta}: ${res.status} ${await res.text()}`);
  return res;
}

export async function enviarTexto(cred: CredencialesWhatsApp, para: string, texto: string) {
  await graph(cred, `${cred.phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to: para,
    type: "text",
    text: { body: texto, preview_url: true },
  });
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
