// Lectura de un PDF de Citrus con la IA (Claude). Se le pasa el PDF tal cual
// y devuelve los datos en un formato fijo (salida estructurada), sin
// depender del diseño exacto del documento.
import type Anthropic from "@anthropic-ai/sdk";
import type { LecturaPDF } from "./tipos.ts";

export type CrearMensaje = (
  params: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Beta.BetaMessage>;

/** Modelo por defecto (economico). Se cambia con CITRUS_MODELO. */
export const MODELO_LECTURA = "claude-haiku-5-5";

const num = { type: ["number", "null"] };
const txt = { type: ["string", "null"] };

export const ESQUEMA_LECTURA = {
  type: "object",
  additionalProperties: false,
  required: ["documentos", "inventario", "advertencias"],
  properties: {
    documentos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "tipo", "numero", "ncf", "fecha", "vencimiento", "cliente", "lineas", "subtotal",
          "descuento", "itbis", "total", "pagado", "saldo", "moneda", "estado", "notas",
        ],
        properties: {
          tipo: { type: "string", enum: ["cotizacion", "factura", "nota_credito", "recibo_pago", "otro"] },
          numero: txt,
          ncf: txt,
          fecha: txt,
          vencimiento: txt,
          cliente: {
            type: "object",
            additionalProperties: false,
            required: ["nombre", "rnc", "telefono"],
            properties: { nombre: txt, rnc: txt, telefono: txt },
          },
          lineas: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["descripcion", "cantidad", "unidad", "precio_unitario", "total"],
              properties: { descripcion: { type: "string" }, cantidad: num, unidad: txt, precio_unitario: num, total: num },
            },
          },
          subtotal: num,
          descuento: num,
          itbis: num,
          total: num,
          pagado: num,
          saldo: num,
          moneda: txt,
          estado: { type: "string", enum: ["pendiente", "parcial", "pagada", "vencida", "desconocido"] },
          notas: txt,
        },
      },
    },
    inventario: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["producto", "codigo", "cantidad", "unidad", "costo"],
        properties: { producto: { type: "string" }, codigo: txt, cantidad: num, unidad: txt, costo: num },
      },
    },
    advertencias: { type: "array", items: { type: "string" } },
  },
} as const;

const INSTRUCCIONES = `Eres el lector de documentos del panel de Corazza Prime Surfaces (República Dominicana). Recibes un PDF generado por Citrus ERP y extraes sus datos.

Puede ser una cotización, una factura, una nota de crédito, un recibo de pago, un reporte de cuentas por cobrar (varias facturas con su saldo), un reporte de ventas o un reporte de inventario.

Reglas:
- Extrae TODOS los documentos que aparezcan. En un reporte de cuentas por cobrar o de ventas, cada fila con número de factura es un documento de tipo "factura" con su total, lo pagado y el saldo.
- En un reporte de inventario, cada producto va en "inventario".
- No inventes nada: si un dato no aparece, usa null. Nunca calcules un dato que el documento no muestra, salvo el saldo cuando aparecen el total y lo pagado.
- Montos como número, sin "RD$" ni separadores de miles (15758.36).
- Fechas en formato AAAA-MM-DD.
- Estado: "pagada" si el saldo es 0, "parcial" si se pagó una parte, "vencida" si el documento lo indica, "pendiente" si no se ha pagado nada, "desconocido" si no se puede saber. Las cotizaciones van como "desconocido".
- Si algo no se lee bien o los montos no cuadran, explícalo en "advertencias" en español, en una oración corta.`;

export async function leerPDF({
  pdfBase64,
  nombreArchivo,
  crear,
  modelo = MODELO_LECTURA,
}: {
  pdfBase64: string;
  nombreArchivo: string;
  crear: CrearMensaje;
  modelo?: string;
}): Promise<LecturaPDF> {
  const respuesta = await crear({
    model: modelo,
    max_tokens: 16000,
    system: INSTRUCCIONES,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 }, title: nombreArchivo },
          { type: "text", text: "Extrae los datos de este documento de Citrus." },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: ESQUEMA_LECTURA } },
  });

  if (respuesta.stop_reason === "refusal") throw new Error("La IA no pudo leer este documento.");
  if (respuesta.stop_reason === "max_tokens") throw new Error("El documento es demasiado largo para leerlo de una vez.");
  const texto = respuesta.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  if (!texto) throw new Error("La IA no devolvió datos.");
  return JSON.parse(texto) as LecturaPDF;
}
