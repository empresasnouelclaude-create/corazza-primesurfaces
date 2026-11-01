// Numeros de WhatsApp desde los que el panel puede escribir a los clientes.
// Todos estan en la misma cuenta de WhatsApp Business de Corazza (WABA) y
// usan el mismo token; cada uno tiene su propio ID de numero en Meta.
//
// Para agregar otro numero (por ejemplo "Flota 2"): agregarlo a REMITENTES
// y poner su variable de entorno en Vercel.

export type Remitente = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Variable de entorno con el ID del numero en Meta (phone_number_id). */
  variable: string;
  /** Si el asistente de IA responde los mensajes que llegan a este numero. */
  asistente: boolean;
};

export const REMITENTES: Remitente[] = [
  {
    id: "corazza",
    nombre: "Corazza",
    descripcion: "WhatsApp principal (asistente y ventas)",
    variable: "WHATSAPP_PHONE_NUMBER_ID",
    asistente: true,
  },
  {
    id: "flota1",
    nombre: "Flota 1",
    descripcion: "Técnico de instalación",
    variable: "WHATSAPP_FLOTA1_PHONE_NUMBER_ID",
    asistente: false,
  },
];

type Entorno = Record<string, string | undefined>;

/** ID del numero en Meta, o null si todavia no esta conectado. */
export function idNumero(remitente: Remitente, entorno: Entorno = process.env): string | null {
  return entorno[remitente.variable]?.trim() || null;
}

/**
 * true si un mensaje que llego a ese numero lo debe responder el asistente.
 * Si Meta no dice a que numero llego, se asume el principal.
 */
export function atiendeAsistente(phoneNumberId: string | null, entorno: Entorno = process.env): boolean {
  if (!phoneNumberId) return true;
  const remitente = REMITENTES.find((r) => idNumero(r, entorno) === phoneNumberId);
  return remitente ? remitente.asistente : phoneNumberId === idNumero(REMITENTES[0], entorno);
}
