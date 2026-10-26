// Comparacion de claves de acceso (paginas internas) sin filtrar por tiempo
// cuantos caracteres coinciden.
import { timingSafeEqual } from "node:crypto";

export function claveCorrecta(recibida: unknown, esperada: string | undefined): boolean {
  if (!esperada || typeof recibida !== "string") return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}
