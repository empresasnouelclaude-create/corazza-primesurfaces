// ============================================================================
// FORMULAS DE "CALCULA TU SUPERFICIE"
//
// Funciones puras, sin dependencias ni imports: se pueden probar con
// `npm test` (node --test, ver formulas.test.ts) y reutilizar en cualquier
// componente. Aqui no hay textos visibles ni estado de React.
//
// Todo se normaliza a centimetros antes de calcular:
//   1 pulgada = 2.54 cm (exacto, por definicion internacional)
//   1 pie cuadrado = 0.09290304 m2 (exacto: 0.3048 m x 0.3048 m)
// ============================================================================

export type Unit = "cm" | "in";
export type Dimension = "largo" | "ancho" | "alto" | "diametro";
export type AreaFormula = "rectangulos" | "circulo";

/** Medidas escritas por la persona, tal cual (texto), por pieza. */
export type PieceInput = Partial<Record<Dimension, string>>;

export type MeasureError = "empty" | "invalid" | "nonpositive" | "too-large";

export const CM_PER_INCH = 2.54;
export const SQ_M_PER_SQ_FT = 0.09290304;
const CM2_PER_M2 = 10_000;

/** Convierte una medida a centimetros. */
export function toCm(value: number, unit: Unit): number {
  return unit === "in" ? value * CM_PER_INCH : value;
}

/** Convierte centimetros a la unidad indicada. */
export function fromCm(valueCm: number, unit: Unit): number {
  return unit === "in" ? valueCm / CM_PER_INCH : valueCm;
}

export function m2ToFt2(m2: number): number {
  return m2 / SQ_M_PER_SQ_FT;
}

/**
 * Interpreta lo que escribio la persona. Acepta coma o punto decimal
 * ("120,5" o "120.5") y espacios alrededor. Devuelve null si no es un
 * numero (vacio, letras, "1.2.3", etc.).
 */
export function parseMeasure(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const text = raw.trim().replace(",", ".");
  if (text === "" || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

export type MeasureResult = { ok: true; cm: number } | { ok: false; error: MeasureError };

/**
 * Valida una medida y la devuelve en centimetros. `maxCm` es el limite
 * razonable para esa dimension (por encima, casi seguro es un error de
 * tipeo o de unidad).
 */
export function validateMeasure(raw: string | undefined, unit: Unit, maxCm: number): MeasureResult {
  if (raw === undefined || raw.trim() === "") return { ok: false, error: "empty" };
  const value = parseMeasure(raw);
  if (value === null) return { ok: false, error: "invalid" };
  if (value <= 0) return { ok: false, error: "nonpositive" };
  const cm = toCm(value, unit);
  if (cm > maxCm) return { ok: false, error: "too-large" };
  return { ok: true, cm };
}

/** Area de un rectangulo, en cm2. */
export function rectangleAreaCm2(largoCm: number, anchoCm: number): number {
  return largoCm * anchoCm;
}

/** Area de un circulo a partir de su diametro, en cm2. */
export function circleAreaCm2(diametroCm: number): number {
  const radio = diametroCm / 2;
  return Math.PI * radio * radio;
}

export type PieceSpec = { dims: readonly Dimension[] };

export type SurfaceEvaluation = {
  /** true si todas las medidas son validas. */
  valid: boolean;
  /** Error por pieza y dimension (solo las que fallan). */
  errors: Partial<Record<Dimension, MeasureError>>[];
  /** Area en m2 (0 si no es valida). */
  areaM2: number;
  /** Cantidad de piezas que componen la superficie. */
  pieceCount: number;
};

/**
 * Evalua una superficie completa. Las formas rectangulares, L, U,
 * salpicadero y personalizada son una suma de rectangulos (cada tramo se
 * mide por separado, sin solaparse); la circular usa el diametro.
 */
export function evaluateSurface(
  formula: AreaFormula,
  specs: readonly PieceSpec[],
  pieces: readonly PieceInput[],
  unit: Unit,
  maxCm: Record<Dimension, number>,
): SurfaceEvaluation {
  const errors: Partial<Record<Dimension, MeasureError>>[] = [];
  let areaCm2 = 0;
  let valid = specs.length > 0;

  specs.forEach((spec, i) => {
    const pieceErrors: Partial<Record<Dimension, MeasureError>> = {};
    const cm: Partial<Record<Dimension, number>> = {};
    for (const dim of spec.dims) {
      const result = validateMeasure(pieces[i]?.[dim], unit, maxCm[dim]);
      if (result.ok) cm[dim] = result.cm;
      else pieceErrors[dim] = result.error;
    }
    errors.push(pieceErrors);
    if (Object.keys(pieceErrors).length > 0) {
      valid = false;
      return;
    }
    if (formula === "circulo") areaCm2 += circleAreaCm2(cm.diametro ?? 0);
    else areaCm2 += rectangleAreaCm2(cm.largo ?? 0, cm.ancho ?? cm.alto ?? 0);
  });

  return { valid, errors, areaM2: valid ? areaCm2 / CM2_PER_M2 : 0, pieceCount: specs.length };
}

/**
 * Convierte un valor escrito de una unidad a otra, para cuando la persona
 * cambia cm <-> pulgadas con medidas ya escritas. Redondea a 2 decimales
 * (error maximo 0.005 de la unidad destino). Si el texto no es un numero,
 * lo deja como esta para no borrar lo que la persona escribio.
 */
export function convertInput(raw: string | undefined, from: Unit, to: Unit): string | undefined {
  if (raw === undefined || from === to) return raw;
  const value = parseMeasure(raw);
  if (value === null) return raw;
  const converted = fromCm(toCm(value, from), to);
  return String(Math.round(converted * 100) / 100);
}

/** Formatea un area con 2 decimales, al estilo es-DO (1,234.56). */
export function formatArea(value: number): string {
  return new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** Formatea una medida escrita: normaliza la coma y quita ceros sobrantes. */
export function formatMeasure(raw: string | undefined): string {
  const value = parseMeasure(raw);
  if (value === null) return raw?.trim() ?? "";
  return new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 }).format(value);
}

// --- Mensaje de WhatsApp ------------------------------------------------------

export type QuoteSurface = {
  name: string;
  unitLabel: string;
  /** Lineas de medidas ya redactadas, p. ej. "Tramo 1: 240 × 60". */
  lines: string[];
  areaM2: number;
};

/**
 * Arma el texto prellenado para WhatsApp: tipo de superficie, medidas,
 * unidades y area estimada de cada una, mas el total.
 */
export function buildQuoteMessage(
  surfaces: readonly QuoteSurface[],
  texts: { greeting: string; total: string; pieces: string; note: string },
  pieceCount: number,
): string {
  const totalM2 = surfaces.reduce((sum, s) => sum + s.areaM2, 0);
  const blocks = surfaces.map((s, i) =>
    [
      `${i + 1}. ${s.name} (${s.unitLabel})`,
      ...s.lines.map((line) => `   ${line}`),
      `   Área: ${formatArea(s.areaM2)} m² (${formatArea(m2ToFt2(s.areaM2))} ft²)`,
    ].join("\n"),
  );
  return [
    texts.greeting,
    "",
    blocks.join("\n\n"),
    "",
    `${texts.total}: ${formatArea(totalM2)} m² (${formatArea(m2ToFt2(totalM2))} ft²)`,
    `${texts.pieces}: ${pieceCount}`,
    "",
    texts.note,
  ].join("\n");
}
