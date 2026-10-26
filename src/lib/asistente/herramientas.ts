// Acciones que la IA puede ejecutar durante la conversacion. Cada una tiene
// su definicion (lo que ve la IA) y su ejecucion (lo que hace el sistema).
// La ejecucion es pura: devuelve la conversacion actualizada, el resultado
// para la IA y las acciones externas (enviar fotos, avisar al vendedor).
import type Anthropic from "@anthropic-ai/sdk";
import { FOTOS_TRABAJOS, GUIA_MEDICION_URL, type TipoFotos } from "./conocimiento.ts";
import type { Accion, Conversacion, DatosCliente, MotivoPase } from "./tipos.ts";

const texto = { type: ["string", "null"] as const };

export const HERRAMIENTAS: Anthropic.Beta.BetaTool[] = [
  {
    name: "guardar_datos_cliente",
    description:
      "Guarda en la ficha del cliente los datos que dio en la conversacion. Llamala cada vez que el cliente da un dato nuevo. Usa null en los campos que no cambian.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        nombre: { ...texto, description: "Nombre del cliente" },
        superficie: { ...texto, description: "Qué quiere proteger, por ejemplo 'isla de cocina' o 'mesa de comedor'" },
        material: { ...texto, description: "Material: mármol, cuarzo, granito, madera, porcelanato u otro" },
        medidas: { ...texto, description: "Medidas tal como las dio, con unidad, por ejemplo '240 x 90 cm'" },
        sector: { ...texto, description: "Sector o ciudad" },
        fecha_deseada: { ...texto, description: "Para cuándo lo necesita, en sus palabras" },
        notas: { ...texto, description: "Otro detalle útil para el vendedor" },
      },
      required: ["nombre", "superficie", "material", "medidas", "sector", "fecha_deseada", "notas"],
      additionalProperties: false,
    },
  },
  {
    name: "enviar_guia_medicion",
    description: "Devuelve el enlace a la guía de la web para medir topes y mesas. Úsala si el cliente no sabe cómo medir.",
    strict: true,
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
  },
  {
    name: "enviar_fotos_trabajos",
    description:
      "Envía al cliente imágenes de referencia de Corazza. 'acabado': cómo se ve la lámina. 'cocina': una superficie protegida. 'kit': el kit de cuidado.",
    strict: true,
    input_schema: {
      type: "object",
      properties: { tipo: { type: "string", enum: Object.keys(FOTOS_TRABAJOS) } },
      required: ["tipo"],
      additionalProperties: false,
    },
  },
  {
    name: "pasar_a_vendedor",
    description:
      "Pasa la conversación a una persona del equipo. Después de usarla, el asistente deja de responder en este chat.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", enum: ["listo_para_cotizar", "pide_persona", "reclamo", "proyecto_grande", "otro"] },
        resumen: { type: "string", description: "Resumen de una o dos líneas para el vendedor" },
      },
      required: ["motivo", "resumen"],
      additionalProperties: false,
    },
  },
];

export type ResultadoHerramienta = {
  conversacion: Conversacion;
  /** Texto que recibe la IA como resultado. */
  resultado: string;
  acciones: Accion[];
};

const CAMPOS: (keyof DatosCliente)[] = ["nombre", "superficie", "material", "medidas", "sector", "fecha_deseada", "notas"];

export function ejecutarHerramienta(
  nombre: string,
  input: unknown,
  conversacion: Conversacion,
  ahora = new Date(),
): ResultadoHerramienta {
  const args = (input ?? {}) as Record<string, unknown>;

  switch (nombre) {
    case "guardar_datos_cliente": {
      const datos = { ...conversacion.datos };
      for (const campo of CAMPOS) {
        const valor = args[campo];
        if (typeof valor === "string" && valor.trim()) datos[campo] = valor.trim();
      }
      const faltan = (["superficie", "material", "medidas", "sector", "fecha_deseada"] as const).filter((c) => !datos[c]);
      return {
        conversacion: { ...conversacion, datos },
        resultado: JSON.stringify({ guardado: true, faltan }),
        acciones: [{ tipo: "datos_actualizados", datos }],
      };
    }
    case "enviar_guia_medicion":
      return { conversacion, resultado: JSON.stringify({ enlace: GUIA_MEDICION_URL }), acciones: [] };
    case "enviar_fotos_trabajos": {
      const tipo = args.tipo as TipoFotos;
      const fotos = FOTOS_TRABAJOS[tipo];
      if (!fotos) return { conversacion, resultado: JSON.stringify({ error: "tipo desconocido" }), acciones: [] };
      return {
        conversacion,
        resultado: JSON.stringify({ enviadas: fotos.length, nota: "Las imágenes se envían después de tu mensaje." }),
        acciones: [{ tipo: "enviar_fotos", fotos }],
      };
    }
    case "pasar_a_vendedor": {
      const motivo = (args.motivo as MotivoPase) ?? "otro";
      const resumen = typeof args.resumen === "string" ? args.resumen : "";
      return {
        conversacion: { ...conversacion, estado: "vendedor", pase: { motivo, resumen, fecha: ahora.toISOString() } },
        resultado: JSON.stringify({ pasado: true, indicacion: "Despídete: alguien del equipo le escribe en breve." }),
        acciones: [{ tipo: "avisar_vendedor", motivo, resumen, datos: conversacion.datos }],
      };
    }
    default:
      return { conversacion, resultado: JSON.stringify({ error: `herramienta desconocida: ${nombre}` }), acciones: [] };
  }
}
