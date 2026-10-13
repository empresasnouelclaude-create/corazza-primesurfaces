// ============================================================================
// FORMULAS DE LA CALCULADORA CORAZZA (uso interno de ventas)
//
// Implementa EXACTAMENTE la seccion 6 y 7 de "Especificaciones Calculadora
// Corazza" (v1.0, octubre 2026). Funciones puras, sin imports: se prueban
// con `npm test` (ver formulas.test.ts).
//
// Reglas clave:
// - Todo se convierte a pies antes de calcular el area.
// - Las areas se suman SIN redondear; el redondeo (2 decimales) es solo
//   para mostrar.
// - El film recomendado lleva margen; la cotizacion NO (precio x area real).
// ============================================================================

export type Unit = "cm" | "in" | "ft" | "m";
export type Shape = "circular" | "rectangular" | "cuadrada";
export type Dimension = "largo" | "ancho" | "diametro" | "lado";

export const SQ_M_PER_SQ_FT = 0.09290304;
export const MARGIN_MIN = 0;
export const MARGIN_MAX = 30;
export const MARGIN_DEFAULT = 10;

/** Dimensiones que pide cada forma, en el orden en que se muestran. */
export const SHAPE_DIMENSIONS: Record<Shape, Dimension[]> = {
  circular: ["diametro"],
  rectangular: ["largo", "ancho"],
  cuadrada: ["lado"],
};

/** Convierte una longitud a pies (seccion 6 de la especificacion). */
export function toFeet(value: number, unit: Unit): number {
  switch (unit) {
    case "cm":
      return value / 30.48;
    case "in":
      return value / 12;
    case "m":
      return value * 3.280839895;
    case "ft":
      return value;
  }
}

/** Area en pies cuadrados de una superficie (dimensiones en su unidad original). */
export function areaFt2(shape: Shape, dims: Partial<Record<Dimension, number>>, unit: Unit): number {
  const ft = (d: Dimension) => toFeet(dims[d] ?? 0, unit);
  switch (shape) {
    case "rectangular":
      return ft("largo") * ft("ancho");
    case "cuadrada":
      return ft("lado") ** 2;
    case "circular":
      return Math.PI * (ft("diametro") / 2) ** 2;
  }
}

export function ft2ToM2(ft2: number): number {
  return ft2 * SQ_M_PER_SQ_FT;
}

/** Suma de areas sin redondeo intermedio. */
export function totalFt2(areas: readonly number[]): number {
  return areas.reduce((sum, a) => sum + a, 0);
}

/** Margen valido (0 a 30). Valores fuera de rango o no numericos se ajustan. */
export function clampMargin(margin: number): number {
  if (!Number.isFinite(margin)) return MARGIN_DEFAULT;
  return Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, margin));
}

/** Film recomendado = area total x (1 + margen/100). */
export function filmFt2(total: number, margin: number): number {
  return total * (1 + clampMargin(margin) / 100);
}

/** Cotizacion = area total REAL x precio por ft² (sin margen). */
export function quote(total: number, pricePerFt2: number): number {
  return total * pricePerFt2;
}

// --- Validacion de numeros -------------------------------------------------

export type NumberError = "empty" | "invalid" | "nonpositive" | "infinite";
export type ParsedNumber = { ok: true; value: number } | { ok: false; error: NumberError };

/**
 * Interpreta un numero escrito por el vendedor. Acepta punto o coma
 * decimal ("183.5" o "183,5") y espacios alrededor. Debe ser finito y
 * mayor que cero.
 */
export function parsePositive(raw: string | undefined): ParsedNumber {
  const text = (raw ?? "").trim().replace(",", ".");
  if (text === "") return { ok: false, error: "empty" };
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(text)) return { ok: false, error: "invalid" };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, error: "infinite" };
  if (value <= 0) return { ok: false, error: "nonpositive" };
  return { ok: true, value };
}

// --- Formato ------------------------------------------------------------------

const TWO_DECIMALS = new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const UP_TO_TWO = new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 });

/** 2 decimales, estilo es-DO (1,234.56). Solo para mostrar. */
export function format2(value: number): string {
  return TWO_DECIMALS.format(value);
}

/** Medida tal como la escribio el vendedor, sin ceros sobrantes (183 o 183.5). */
export function formatDimension(value: number): string {
  return UP_TO_TWO.format(value);
}

export function formatRD(value: number): string {
  return `RD$${TWO_DECIMALS.format(value)}`;
}
