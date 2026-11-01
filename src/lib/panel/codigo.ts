// Codigo de cliente: numero secuencial que asigna la base de datos a cada
// conversacion (ver supabase/esquema.sql). Se muestra con 4 digitos.

/** 7 -> "0007". */
export function formatoCodigo(codigo: number | null | undefined): string | null {
  return typeof codigo === "number" && Number.isFinite(codigo) ? String(codigo).padStart(4, "0") : null;
}

/** "#0007", "0007" o "7" -> 7. Devuelve null si no es un codigo. */
export function leerCodigo(texto: string): number | null {
  const t = texto.trim().replace(/^#/, "");
  return /^\d{1,6}$/.test(t) ? Number(t) : null;
}

/** true si el cliente coincide con lo buscado (codigo, nombre o telefono). */
export function coincide(busqueda: string, c: { codigo?: number | string | null; nombre?: string | null; telefono?: string | null }): boolean {
  const q = busqueda.trim();
  if (!q) return true;
  const codigo = leerCodigo(q);
  if (codigo !== null && Number(c.codigo) === codigo) return true;
  const sin = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (c.nombre && sin(c.nombre).includes(sin(q))) return true;
  const digitos = q.replace(/\D/g, "");
  return digitos.length >= 4 && !!c.telefono && c.telefono.includes(digitos);
}
