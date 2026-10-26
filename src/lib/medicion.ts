// Origen de cada clic a WhatsApp a partir de los UTM de la visita.
// Usado por src/app/components/Medicion.tsx.

/** Referencia corta a partir de los UTM de la visita (o null si no hay). */
export function referenciaDesde(search: string): string | null {
  const p = new URLSearchParams(search);
  const ref = p.get("utm_content") || p.get("utm_campaign") || p.get("utm_source");
  return ref ? ref.trim().slice(0, 40) : null;
}

/** Agrega "(ref: X)" al texto de un enlace de wa.me, una sola vez. */
export function enlaceConReferencia(href: string, ref: string): string {
  const url = new URL(href);
  const texto = url.searchParams.get("text") ?? "";
  if (texto.includes("(ref:")) return href;
  url.searchParams.set("text", `${texto} (ref: ${ref})`.trim());
  return url.toString();
}
