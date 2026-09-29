// ============================================================================
// CONFIGURACION EDITABLE DE "CALCULA TU SUPERFICIE"
//
// Formas disponibles, nombres, textos de ayuda, mensajes de error, limites
// de medida y el texto del mensaje de WhatsApp. Los componentes de
// src/app/components/calculadora/ solo leen de aqui; las formulas viven en
// ./formulas.ts.
// ============================================================================

import type { AreaFormula, Dimension, MeasureError, Unit } from "./formulas";

export type ShapeId = "rectangular" | "circular" | "l" | "u" | "salpicadero" | "personalizada";

export type ShapeConfig = {
  id: ShapeId;
  /** Nombre visible en la tarjeta y en el resumen. */
  name: string;
  /** Una linea bajo el nombre, en la tarjeta. */
  caption: string;
  /** Ayuda del paso 2 (como medir esta forma). */
  help: string;
  formula: AreaFormula;
  /** Piezas fijas (la personalizada arranca con una y permite agregar). */
  pieces: { label: string; dims: Dimension[] }[];
};

const LARGO_ANCHO: Dimension[] = ["largo", "ancho"];

export const SHAPES: ShapeConfig[] = [
  {
    id: "rectangular",
    name: "Tope lineal",
    caption: "Rectangular",
    help: "Mide el largo total y el ancho (fondo) del tope.",
    formula: "rectangulos",
    pieces: [{ label: "Tope", dims: LARGO_ANCHO }],
  },
  {
    id: "circular",
    name: "Tope circular",
    caption: "Mesa o tope redondo",
    help: "Mide de borde a borde, pasando por el centro.",
    formula: "circulo",
    pieces: [{ label: "Tope", dims: ["diametro"] }],
  },
  {
    id: "l",
    name: "Tope en L",
    caption: "Dos tramos",
    help: "El tramo 1 es el más largo, de punta a punta. El tramo 2 se mide desde el borde del tramo 1, sin volver a contar la esquina.",
    formula: "rectangulos",
    pieces: [
      { label: "Tramo 1", dims: LARGO_ANCHO },
      { label: "Tramo 2", dims: LARGO_ANCHO },
    ],
  },
  {
    id: "u",
    name: "Tope en U",
    caption: "Tres tramos",
    help: "Los tramos 1 y 3 son los laterales, de punta a punta. El tramo 2 es el central y se mide entre los dos laterales.",
    formula: "rectangulos",
    pieces: [
      { label: "Tramo 1", dims: LARGO_ANCHO },
      { label: "Tramo 2", dims: LARGO_ANCHO },
      { label: "Tramo 3", dims: LARGO_ANCHO },
    ],
  },
  {
    id: "salpicadero",
    name: "Salpicadero",
    caption: "Backsplash de pared",
    help: "Mide el largo sobre el tope y la altura hasta donde llega el revestimiento.",
    formula: "rectangulos",
    pieces: [{ label: "Salpicadero", dims: ["largo", "alto"] }],
  },
  {
    id: "personalizada",
    name: "Forma personalizada",
    caption: "Varias piezas",
    help: "Divide la superficie en rectángulos y agrega cada uno como una pieza. Si prefieres, te visitamos para medir.",
    formula: "rectangulos",
    pieces: [{ label: "Pieza 1", dims: LARGO_ANCHO }],
  },
];

export const CUSTOM_PIECE_LIMIT = 12;

export const DIMENSION_LABELS: Record<Dimension, string> = {
  largo: "Largo",
  ancho: "Ancho",
  alto: "Alto",
  diametro: "Diámetro",
};

export const UNITS: { id: Unit; label: string; short: string }[] = [
  { id: "cm", label: "Centímetros", short: "cm" },
  { id: "in", label: "Pulgadas", short: "pulg" },
];

// Limite razonable por dimension, en centimetros. Por encima se muestra un
// aviso (suele ser un error de tipeo o de unidad).
// TODO(cliente): confirmar estos maximos segun los proyectos que atiende
// Corazza (hoy: 20 m de largo, 5 m de ancho/diametro, 4 m de alto).
export const MAX_CM: Record<Dimension, number> = {
  largo: 2000,
  ancho: 500,
  alto: 400,
  diametro: 500,
};

export const ERROR_MESSAGES: Record<MeasureError, string> = {
  empty: "Escribe esta medida.",
  invalid: "Usa solo números, por ejemplo 120 o 120,5.",
  nonpositive: "La medida debe ser mayor que cero.",
  "too-large": "Parece demasiado grande. Revisa la medida y la unidad.",
};

export const COPY = {
  title: "Calcula tu superficie",
  intro: "Elige la forma, escribe las medidas y obtén al instante el área estimada para tu cotización.",
  step1: "Elige la forma",
  step2: "Escribe las medidas",
  step3: "Tu estimado",
  unitLegend: "Unidad de medida",
  noShape: "Elige una forma para empezar a medir.",
  addPiece: "Agregar pieza",
  removePiece: "Quitar pieza",
  requestVisit: "Solicitar medición",
  totalM2: "Área total estimada",
  pieces: "Piezas",
  surfaces: "Superficies",
  summary: "Resumen",
  editing: "Editando",
  edit: "Editar",
  remove: "Quitar",
  incomplete: "Medidas incompletas",
  quote: "Solicitar cotización por WhatsApp",
  addSurface: "Agregar otra superficie",
  quoteDisabled: "Completa las medidas para enviar tu cotización.",
  addDisabled: "Completa esta superficie antes de agregar otra.",
  disclaimer: "Este cálculo es una estimación. La medida final será confirmada por el equipo de Corazza.",
} as const;

// Mensaje prellenado de WhatsApp.
// TODO(cliente): ajustar el saludo si quieren pedir datos extra (ciudad,
// material de la superficie, acabado High Gloss / Ultra Matte, etc.).
export const WHATSAPP_TEXT = {
  greeting: "Hola, quiero cotizar la protección de estas superficies:",
  total: "Área total estimada",
  pieces: "Piezas",
  note: "Cálculo estimado desde la web de Corazza. Quedo atento a la confirmación de las medidas.",
  visit: "Hola, quiero solicitar una medición de mi superficie. Tiene una forma personalizada.",
};
