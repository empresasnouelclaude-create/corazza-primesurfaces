// Cliente real de la IA (API de Claude). Separado del motor para que las
// pruebas usen una IA simulada sin cargar el SDK ni gastar en llamadas.
import Anthropic from "@anthropic-ai/sdk";
import { MODELO_POR_DEFECTO, type CrearMensaje } from "./motor.ts";

export function configuracionIA(): { crear: CrearMensaje; modelo: string } | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  return {
    crear: (params) => client.beta.messages.create(params),
    modelo: process.env.ASISTENTE_MODELO || MODELO_POR_DEFECTO,
  };
}
