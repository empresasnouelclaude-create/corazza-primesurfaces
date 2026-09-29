import { DIMENSION_LABELS, MAX_CM, SHAPES, UNITS, type ShapeConfig, type ShapeId } from "../../calculadora/config";
import {
  evaluateSurface,
  formatMeasure,
  type Dimension,
  type PieceInput,
  type PieceSpec,
  type SurfaceEvaluation,
  type Unit,
} from "../../calculadora/formulas";

// Modelo de una superficie en la calculadora (una por cada "Agregar otra
// superficie"). Las medidas se guardan como texto, tal como se escriben;
// las formulas las validan y convierten.
export type Surface = {
  id: string;
  shape: ShapeId | null;
  unit: Unit;
  pieces: PieceInput[];
  /** Campos que la persona ya visito ("0-largo"): solo ahi se muestran errores. */
  touched: Record<string, true>;
  /** true tras intentar agregar/enviar con datos incompletos: muestra todos los errores. */
  showAllErrors: boolean;
  /** Valores antes del ultimo cambio de unidad (para volver sin redondeos). */
  unitMemo?: { unit: Unit; pieces: PieceInput[]; converted: PieceInput[] };
};

export const CUSTOM_DIMS: Dimension[] = ["largo", "ancho"];

// El id lo decide el componente (contador propio), para que el render del
// servidor y el del cliente generen los mismos ids.
export function newSurface(id: string, unit: Unit = "cm"): Surface {
  return { id, shape: null, unit, pieces: [], touched: {}, showAllErrors: false };
}

export function shapeConfig(shape: ShapeId | null): ShapeConfig | undefined {
  return SHAPES.find((s) => s.id === shape);
}

/** Piezas (con su etiqueta y dimensiones) que corresponden a la superficie. */
export function pieceSpecs(surface: Surface): (PieceSpec & { label: string })[] {
  const config = shapeConfig(surface.shape);
  if (!config) return [];
  if (config.id === "personalizada") {
    return surface.pieces.map((_, i) => ({ label: `Pieza ${i + 1}`, dims: CUSTOM_DIMS }));
  }
  return config.pieces;
}

export function evaluate(surface: Surface): SurfaceEvaluation {
  const config = shapeConfig(surface.shape);
  if (!config) return { valid: false, errors: [], areaM2: 0, pieceCount: 0 };
  return evaluateSurface(config.formula, pieceSpecs(surface), surface.pieces, surface.unit, MAX_CM);
}

export function unitShort(unit: Unit): string {
  return UNITS.find((u) => u.id === unit)?.short ?? unit;
}

export function unitLabel(unit: Unit): string {
  return (UNITS.find((u) => u.id === unit)?.label ?? unit).toLowerCase();
}

/**
 * Lineas legibles de las medidas, p. ej. "Tramo 1: 240 × 60" o
 * "Diámetro: 120". Si falta un valor se muestra "…" en su lugar.
 */
export function summaryLines(surface: Surface): string[] {
  const specs = pieceSpecs(surface);
  const single = specs.length === 1 && surface.shape !== "personalizada";
  return specs.map((spec, i) => {
    const values = spec.dims.map((d) => formatMeasure(surface.pieces[i]?.[d]) || "…").join(" × ");
    const dimsLabel = spec.dims.map((d, j) => (j === 0 ? DIMENSION_LABELS[d] : DIMENSION_LABELS[d].toLowerCase())).join(" × ");
    return single ? `${dimsLabel}: ${values}` : `${spec.label} (${dimsLabel.toLowerCase()}): ${values}`;
  });
}
