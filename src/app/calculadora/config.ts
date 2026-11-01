// ============================================================================
// TEXTOS Y OPCIONES DE LA CALCULADORA CORAZZA (uso interno de ventas)
//
// Todo lo visible que no es una formula vive aqui, para poder ajustarlo
// sin tocar los componentes. Las formulas estan en ./formulas.ts.
//
// Pensado para crecer (seccion 11 de la especificacion): datos del
// vendedor, numero de cotizacion, catalogo de film y anchos de rollo se
// agregarian como nuevas entradas aqui y campos nuevos en el estado.
// ============================================================================

import type { Dimension, NumberError, Shape, Unit } from "./formulas";

// Orden exigido por la especificacion: Circular, Rectangular, Cuadrada.
export const SHAPES: { id: Shape; label: string }[] = [
  { id: "circular", label: "Circular" },
  { id: "rectangular", label: "Rectangular" },
  { id: "cuadrada", label: "Cuadrada" },
];

export const UNITS: { id: Unit; label: string; short: string }[] = [
  { id: "cm", label: "Centímetros", short: "cm" },
  { id: "in", label: "Pulgadas", short: "in" },
  { id: "ft", label: "Pies", short: "ft" },
  { id: "m", label: "Metros", short: "m" },
];

export const DEFAULT_SHAPE: Shape = "rectangular";
export const DEFAULT_UNIT: Unit = "cm";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  largo: "Largo",
  ancho: "Ancho",
  diametro: "Diámetro",
  lado: "Lado",
};

export const ERRORS: Record<NumberError, string> = {
  empty: "Escribe esta medida.",
  invalid: "Usa solo números (por ejemplo 183 o 183,5).",
  nonpositive: "Debe ser mayor que cero.",
  infinite: "El número es demasiado grande.",
};

export const PRICE_ERRORS: Record<NumberError, string> = {
  empty: "",
  invalid: "Escribe solo el número, sin RD$ (por ejemplo 800).",
  nonpositive: "El precio debe ser mayor que cero.",
  infinite: "El número es demasiado grande.",
};

export const TEXT = {
  appTitle: "Calculadora Corazza",
  internal: "Uso interno · Ventas",
  clientSection: "Cliente",
  clientLabel: "Cliente",
  clientPlaceholder: "Nombre del cliente",
  reset: "Nuevo cliente / Reset",
  confirmReset: "¿Empezar un nuevo cliente? Se borrarán el cliente, las medidas, el precio y el reporte.",
  captureSection: "Agregar superficie",
  descriptionLabel: "Descripción",
  descriptionPlaceholder: "Ej.: Mesa comedor",
  shapeLabel: "Forma",
  unitLabel: "Unidad",
  add: "+ Agregar medida",
  listSection: "Medidas",
  empty: "Todavía no hay superficies. Agrega la primera medida.",
  remove: "Eliminar",
  clearItems: "Borrar medidas",
  confirmClear: "¿Borrar todas las medidas de este cliente?",
  defaultDescription: (n: number) => `Superficie ${n}`,
  added: (name: string) => `Medida agregada: ${name}.`,
  summarySection: "Resumen",
  totalArea: "Área total",
  margin: "Margen",
  film: "Film recomendado",
  priceLabel: "Precio por ft² (RD$)",
  pricePlaceholder: "Opcional",
  unitPrice: "Precio por ft²",
  quote: "Cotización estimada",
  filmNote:
    "El film recomendado es una estimación por área: no garantiza el aprovechamiento de los rollos, la orientación de los cortes ni los anchos disponibles.",
  quoteNote:
    "La cotización se calcula sobre el film recomendado (área total + margen). En el reporte del cliente solo aparecen el área total y el monto, sin el margen.",
  generate: "Generar reporte",
  generateDisabled: "Agrega al menos una superficie para generar el reporte.",
  reportTitle: "Reporte de medidas",
  reportDate: "Fecha",
  reportClient: "Cliente",
  reportNoClient: "Sin nombre",
  reportSurface: "Superficie",
  reportShape: "Forma",
  reportMeasures: "Medidas",
  reportArea: "Área",
  reportStale: "Agrega al menos una superficie para volver a generar el reporte.",
  surfacesCount: (n: number) => (n === 1 ? "1 superficie" : `${n} superficies`),
} as const;
