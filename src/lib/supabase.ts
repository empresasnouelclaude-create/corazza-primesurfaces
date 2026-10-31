// Conexion a la base de datos de Corazza (Supabase). Solo se usa en el
// servidor: la clave service_role nunca llega al navegador.
// Si faltan las variables, devuelve null y cada parte sigue en modo de prueba.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null | undefined;

export function baseDeDatos(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cliente = url && clave ? createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return cliente;
}
