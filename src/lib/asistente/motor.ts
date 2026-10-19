// Motor del asistente: recibe lo que escribio el cliente, conversa con la
// IA (Claude), ejecuta las acciones que la IA pide y devuelve los mensajes
// que hay que enviar por WhatsApp. No sabe nada de WhatsApp ni de la base de
// datos: recibe la conversacion y devuelve la conversacion actualizada, asi
// sirve igual para el webhook de WhatsApp y para el simulador.
import type Anthropic from "@anthropic-ai/sdk";
import { HERRAMIENTAS, ejecutarHerramienta } from "./herramientas.ts";
import { instruccionesAsistente } from "./prompt.ts";
import type { Accion, Conversacion, Entrada } from "./tipos.ts";

export type ParametrosIA = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
export type CrearMensaje = (params: ParametrosIA) => Promise<Anthropic.Beta.BetaMessage>;

/** Modelo por defecto; se cambia con la variable ASISTENTE_MODELO. */
export const MODELO_POR_DEFECTO = "claude-opus-5-5";

/** Mensaje cuando la IA no puede seguir y la conversacion pasa al equipo. */
export const MENSAJE_PASE = "Gracias por escribirnos. Le paso tu mensaje a alguien del equipo para que te ayude en breve.";

// Tope de vueltas IA -> herramienta -> IA en un mismo mensaje del cliente.
const MAX_VUELTAS = 6;

export type Respuesta = {
  conversacion: Conversacion;
  /** Textos a enviar al cliente, en orden. */
  respuestas: string[];
  acciones: Accion[];
};

function contenidoCliente(entrada: Entrada): Anthropic.Beta.BetaContentBlockParam[] {
  const bloques: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (entrada.imagen) {
    bloques.push({
      type: "image",
      source: { type: "base64", media_type: entrada.imagen.mime, data: entrada.imagen.base64 },
    });
  }
  const texto = entrada.texto?.trim();
  bloques.push({ type: "text", text: texto || "(El cliente envió una imagen sin texto)" });
  return bloques;
}

export function parametrosIA(conversacion: Conversacion, modelo: string): ParametrosIA {
  return {
    model: modelo,
    max_tokens: 4000,
    system: instruccionesAsistente(),
    tools: HERRAMIENTAS,
    messages: conversacion.mensajes,
    // Conversacion de atencion: esfuerzo bajo = respuestas rapidas y cortas.
    output_config: { effort: "low" },
    // Las instrucciones y herramientas no cambian: se cachean.
    cache_control: { type: "ephemeral" },
    // Si el modelo declina por politica, la API reintenta con el modelo de
    // respaldo recomendado. En modelos sin respaldo no tiene efecto.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
}

export async function responder({
  conversacion,
  entrada,
  crear,
  modelo = MODELO_POR_DEFECTO,
  ahora = new Date(),
}: {
  conversacion: Conversacion;
  entrada: Entrada;
  crear: CrearMensaje;
  modelo?: string;
  ahora?: Date;
}): Promise<Respuesta> {
  let conv: Conversacion = { ...conversacion, mensajes: [...conversacion.mensajes], actualizado: ahora.toISOString() };
  const respuestas: string[] = [];
  const acciones: Accion[] = [];

  // El historial se guarda siempre, aunque la conversacion la lleve un vendedor.
  conv.mensajes.push({ role: "user", content: contenidoCliente(entrada) });
  if (!conv.datos.nombre && entrada.nombrePerfil) conv.datos = { ...conv.datos, nombre: entrada.nombrePerfil };
  if (conv.estado === "vendedor") return { conversacion: conv, respuestas, acciones };

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const respuesta = await crear(parametrosIA(conv, modelo));

    if (respuesta.stop_reason === "refusal") {
      const motivo = "otro" as const;
      const resumen = "El asistente no pudo responder este mensaje.";
      conv = { ...conv, estado: "vendedor", pase: { motivo, resumen, fecha: ahora.toISOString() } };
      respuestas.push(MENSAJE_PASE);
      acciones.push({ tipo: "avisar_vendedor", motivo, resumen, datos: conv.datos });
      break;
    }

    // Se guarda el contenido tal cual (incluye bloques de razonamiento).
    conv.mensajes.push({ role: "assistant", content: respuesta.content });

    const texto = respuesta.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text.trim())
      .filter(Boolean)
      .join("\n\n");
    if (texto) respuestas.push(texto);

    if (respuesta.stop_reason === "pause_turn") continue;
    if (respuesta.stop_reason !== "tool_use") break;

    const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const bloque of respuesta.content) {
      if (bloque.type !== "tool_use") continue;
      const r = ejecutarHerramienta(bloque.name, bloque.input, conv, ahora);
      conv = r.conversacion;
      acciones.push(...r.acciones);
      resultados.push({ type: "tool_result", tool_use_id: bloque.id, content: r.resultado });
    }
    conv.mensajes.push({ role: "user", content: resultados });
  }

  return { conversacion: conv, respuestas, acciones };
}
