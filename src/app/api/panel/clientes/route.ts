// Ultimas fichas de clientes que lleno el asistente de WhatsApp:
// corazza.com.do/api/panel/clientes. Las usa la calculadora para cotizar
// arrastrando la ficha. Protegido con la clave PANEL_CLAVE.
// POST { clave } -> { conectado, clientes }
import { claveCorrecta } from "@/lib/clave.ts";
import { baseDeDatos } from "@/lib/supabase.ts";

const LIMITE = 20;

export async function POST(request: Request) {
  if (!process.env.PANEL_CLAVE) return Response.json({ error: "El panel está apagado (falta PANEL_CLAVE)." }, { status: 503 });
  let cuerpo: { clave?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: "Formato inválido." }, { status: 400 });
  }
  if (!claveCorrecta(cuerpo.clave, process.env.PANEL_CLAVE)) return Response.json({ error: "Clave incorrecta." }, { status: 401 });

  const db = baseDeDatos();
  if (!db) return Response.json({ conectado: false, clientes: [] });

  const { data, error } = await db
    .from("conversaciones")
    .select("id, estado, datos, actualizado")
    .order("actualizado", { ascending: false })
    .limit(LIMITE * 3);
  if (error) {
    console.error("Clientes del panel:", error);
    return Response.json({ error: "No se pudo conectar con la base de datos." }, { status: 502 });
  }
  const clientes = (data ?? [])
    .map((f) => {
      const datos = (f.datos ?? {}) as Partial<Record<"nombre" | "superficie" | "material" | "medidas" | "sector" | "notas", string | null>>;
      return { ...datos, telefono: f.id as string, estado: f.estado as string, actualizado: f.actualizado as string };
    })
    .filter((c) => c.superficie || c.medidas)
    .slice(0, LIMITE);
  return Response.json({ conectado: true, clientes });
}
