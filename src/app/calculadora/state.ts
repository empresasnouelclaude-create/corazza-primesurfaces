// Estado de la Calculadora Corazza como reducer puro (sin React), para
// poder probarlo con `npm test` igual que las formulas.
import { DEFAULT_SHAPE, DEFAULT_UNIT, TEXT } from "./config.ts";
import {
  MARGIN_DEFAULT,
  SHAPE_DIMENSIONS,
  areaFt2,
  clampMargin,
  filmFt2,
  parsePositive,
  quote,
  totalFt2,
  type Dimension,
  type NumberError,
  type Shape,
  type Unit,
} from "./formulas.ts";

export type Item = {
  id: number;
  description: string;
  shape: Shape;
  unit: Unit;
  dims: Partial<Record<Dimension, number>>;
  areaFt2: number;
};

export type Report = {
  date: Date;
  client: string;
  items: Item[];
  totalFt2: number;
  margin: number;
  filmFt2: number;
  pricePerFt2: number | null;
  quote: number | null;
};

export type State = {
  client: string;
  description: string;
  shape: Shape;
  unit: Unit;
  dimInputs: Partial<Record<Dimension, string>>;
  dimErrors: Partial<Record<Dimension, NumberError>>;
  items: Item[];
  nextId: number;
  margin: number;
  priceInput: string;
  report: Report | null;
  /** true si habia un reporte y luego cambiaron los datos (para avisar). */
  reportStale: boolean;
};

export type Action =
  | { type: "client"; value: string }
  | { type: "description"; value: string }
  | { type: "shape"; value: Shape }
  | { type: "unit"; value: Unit }
  | { type: "dim"; dim: Dimension; value: string }
  | { type: "add" }
  | { type: "remove"; id: number }
  | { type: "clearItems" }
  | { type: "reset" }
  | { type: "margin"; value: number }
  | { type: "price"; value: string }
  | { type: "generate"; date: Date };

export function initialState(): State {
  return {
    client: "",
    description: "",
    shape: DEFAULT_SHAPE,
    unit: DEFAULT_UNIT,
    dimInputs: {},
    dimErrors: {},
    items: [],
    nextId: 1,
    margin: MARGIN_DEFAULT,
    priceInput: "",
    report: null,
    reportStale: false,
  };
}

/** Precio valido o null (vacio o invalido). */
export function priceValue(state: State): number | null {
  const parsed = parsePositive(state.priceInput);
  return parsed.ok ? parsed.value : null;
}

export function totals(state: State) {
  const total = totalFt2(state.items.map((i) => i.areaFt2));
  const price = priceValue(state);
  return {
    totalFt2: total,
    filmFt2: filmFt2(total, state.margin),
    pricePerFt2: price,
    quote: price === null ? null : quote(total, price),
  };
}

// Cualquier cambio en los datos del reporte (cliente, medidas, margen o
// precio) lo invalida: se oculta hasta generarlo de nuevo.
function invalidate(state: State): State {
  return state.report ? { ...state, report: null, reportStale: true } : state;
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "client":
      return invalidate({ ...state, client: action.value });
    case "description":
      return { ...state, description: action.value };
    case "shape":
      return { ...state, shape: action.value, dimErrors: {} };
    case "unit":
      return { ...state, unit: action.value };
    case "dim": {
      const dimErrors = { ...state.dimErrors };
      delete dimErrors[action.dim];
      return { ...state, dimInputs: { ...state.dimInputs, [action.dim]: action.value }, dimErrors };
    }
    case "add": {
      const dims: Partial<Record<Dimension, number>> = {};
      const dimErrors: Partial<Record<Dimension, NumberError>> = {};
      for (const dim of SHAPE_DIMENSIONS[state.shape]) {
        const parsed = parsePositive(state.dimInputs[dim]);
        if (parsed.ok) dims[dim] = parsed.value;
        else dimErrors[dim] = parsed.error;
      }
      if (Object.keys(dimErrors).length > 0) return { ...state, dimErrors };
      const item: Item = {
        id: state.nextId,
        description: state.description.trim() || TEXT.defaultDescription(state.items.length + 1),
        shape: state.shape,
        unit: state.unit,
        dims,
        areaFt2: areaFt2(state.shape, dims, state.unit),
      };
      // Tras agregar: se limpian descripcion y medidas, pero se conservan
      // la forma y la unidad (seccion 4).
      return invalidate({
        ...state,
        items: [...state.items, item],
        nextId: state.nextId + 1,
        description: "",
        dimInputs: {},
        dimErrors: {},
      });
    }
    case "remove":
      return invalidate({ ...state, items: state.items.filter((i) => i.id !== action.id) });
    case "clearItems":
      return invalidate({ ...state, items: [] });
    case "reset":
      return initialState();
    case "margin":
      return invalidate({ ...state, margin: clampMargin(action.value) });
    case "price":
      return invalidate({ ...state, priceInput: action.value });
    case "generate": {
      if (state.items.length === 0) return state;
      const t = totals(state);
      return {
        ...state,
        reportStale: false,
        report: {
          date: action.date,
          client: state.client.trim(),
          items: state.items,
          totalFt2: t.totalFt2,
          margin: state.margin,
          filmFt2: t.filmFt2,
          pricePerFt2: t.pricePerFt2,
          quote: t.quote,
        },
      };
    }
  }
}
