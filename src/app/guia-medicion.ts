// ============================================================================
// GUIA "¿CÓMO MEDIR MI TOPE?"
//
// Texto copiado LITERALMENTE de las laminas de referencia (mismas palabras,
// mayusculas, tildes y signos). No agregar texto propio: los diagramas se
// redibujaron en el estilo de Corazza, pero sus etiquetas son las mismas.
// Las piezas numeradas y las cotas (LARGO, ANCHO, ALTO, DIÁMETRO) viven en
// src/app/components/guia/GuiaMedicion.tsx, junto a cada dibujo.
// ============================================================================

export const GUIA = {
  // Portada: "¿CÓMO / MEDIR / MI TOPE?" (MEDIR destacado).
  title: { before: "¿CÓMO", strong: "MEDIR", after: "MI TOPE?" },

  backsplash: { title: "BACKSPLASH", subtitle: "(SALPICADERO)" },
  lineal: { title: { light: "TOPE", strong: "LINEAL" } },
  circular: { title: { light: "TOPE", strong: "CIRCULAR" } },
  enL: {
    title: { light: "TOPE", strong: "EN L" },
    // "Identifica las **uniones** de tu tope:"
    intro: { before: "Identifica las", strong: "uniones", after: "de tu tope:" },
    unions: ["UNIÓN 1", "UNIÓN 2", "UNIÓN 3"],
  },

  labels: { largo: "LARGO", ancho: "ANCHO", alto: "ALTO", diametro: "DIÁMETRO" },
} as const;
