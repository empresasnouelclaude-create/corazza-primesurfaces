// Interpreta las medidas que un cliente escribio por WhatsApp (texto libre,
// como quedan en la ficha del asistente) para precargarlas en la
// calculadora. Si no se entienden, devuelve null y el vendedor las escribe.
import type { Dimension, Shape, Unit } from "./formulas.ts";

export type MedidasLeidas = { shape: Shape; unit: Unit | null; dims: Partial<Record<Dimension, string>> };

const UNIDADES: [RegExp, Unit][] = [
  [/\b(cm|cms|cent[ií]metros?)\b/i, "cm"],
  [/(\bin\b|\bpulg|pulgadas?|")/i, "in"],
  [/\b(ft|pies?)\b|'/i, "ft"],
  [/\b(m|mts?|metros?)\b/i, "m"],
];

function unidad(texto: string): Unit | null {
  for (const [patron, u] of UNIDADES) if (patron.test(texto)) return u;
  return null;
}

/** Primera medida del texto (si hay varias superficies, se toma la primera). */
export function leerMedidas(texto: string | null | undefined): MedidasLeidas | null {
  if (!texto) return null;
  const primera = texto.split(/;|\n/)[0];
  const numero = String.raw`(\d+(?:[.,]\d+)?)`;
  const rect = primera.match(new RegExp(`${numero}\\s*(?:[a-zA-Z"'´]+\\s*)?(?:x|×|\\*|por)\\s*${numero}`, "i"));
  if (rect) {
    const [a, b] = [rect[1], rect[2]].map((n) => n.replace(",", "."));
    return { shape: a === b ? "cuadrada" : "rectangular", unit: unidad(primera), dims: a === b ? { lado: a } : { largo: a, ancho: b } };
  }
  const solo = primera.match(new RegExp(numero));
  if (solo && /di[aá]metro|redond|circular|\bø/i.test(primera)) {
    return { shape: "circular", unit: unidad(primera), dims: { diametro: solo[1].replace(",", ".") } };
  }
  return null;
}

export type SuperficieLeida = MedidasLeidas & { description: string };

/**
 * Todas las superficies de la ficha ("comedor 50 x 25 in; centro 10 x 40 in").
 * La descripcion sale de las palabras antes de la medida o, si no hay, de
 * lo que el cliente quiere proteger. Si una parte no trae unidad, toma la de
 * la parte anterior o la de la ultima parte que la tenga.
 */
export function leerSuperficies(medidas: string | null | undefined, superficie: string | null | undefined): SuperficieLeida[] {
  if (!medidas) return [];
  const partes = medidas.split(/;|\n/).map((t) => t.trim()).filter(Boolean);
  const leidas = partes.map((parte) => {
    const m = leerMedidas(parte);
    if (!m) return null;
    // Palabras que describen la medida, no la superficie ("redonda de", "mide").
    const etiqueta = parte
      .split(/\d/)[0]
      .replace(/[:\-–]/g, " ")
      .replace(/\b(redond[ao]s?|circular|di[aá]metro|de|del|mide|miden|medidas?|aprox(imadamente)?|unos?|como|es|son)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return { ...m, description: etiqueta || (superficie ?? "").trim() };
  });
  const unidadComun = leidas.find((l) => l?.unit)?.unit ?? null;
  return leidas
    .filter((l): l is SuperficieLeida => l !== null)
    .map((l, i, lista) => ({ ...l, unit: l.unit ?? lista[i - 1]?.unit ?? unidadComun, description: l.description || `Superficie ${i + 1}` }));
}
