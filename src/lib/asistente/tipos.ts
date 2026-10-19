// Tipos del asistente. Una "conversacion" es todo lo que hace falta para
// seguir atendiendo a un cliente: su historial con la IA, los datos que ya
// dio y si la conversacion la lleva el asistente o un vendedor.
import type Anthropic from "@anthropic-ai/sdk";

export type MensajeIA = Anthropic.Beta.BetaMessageParam;

export type DatosCliente = {
  nombre: string | null;
  superficie: string | null;
  material: string | null;
  medidas: string | null;
  sector: string | null;
  fecha_deseada: string | null;
  notas: string | null;
};

export const DATOS_VACIOS: DatosCliente = {
  nombre: null,
  superficie: null,
  material: null,
  medidas: null,
  sector: null,
  fecha_deseada: null,
  notas: null,
};

export type MotivoPase = "listo_para_cotizar" | "pide_persona" | "reclamo" | "proyecto_grande" | "otro";

export type Conversacion = {
  /** Telefono del cliente en formato internacional, sin "+". */
  id: string;
  /** "asistente": responde la IA. "vendedor": la IA no responde. */
  estado: "asistente" | "vendedor";
  datos: DatosCliente;
  /** Historial tal como lo devuelve la API (se reenvia sin modificar). */
  mensajes: MensajeIA[];
  pase: { motivo: MotivoPase; resumen: string; fecha: string } | null;
  actualizado: string;
};

/** Lo que el sistema debe hacer fuera de la conversacion de texto. */
export type Accion =
  | { tipo: "enviar_fotos"; fotos: readonly { url: string; pie: string }[] }
  | { tipo: "avisar_vendedor"; motivo: MotivoPase; resumen: string; datos: DatosCliente }
  | { tipo: "datos_actualizados"; datos: DatosCliente };

/** Entrada del cliente: texto y, opcionalmente, una imagen ya descargada. */
export type Entrada = {
  texto: string | null;
  imagen?: { base64: string; mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif" } | null;
  nombrePerfil?: string | null;
};

export function nuevaConversacion(id: string, ahora = new Date()): Conversacion {
  return { id, estado: "asistente", datos: { ...DATOS_VACIOS }, mensajes: [], pase: null, actualizado: ahora.toISOString() };
}
