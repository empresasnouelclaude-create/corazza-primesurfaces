// Fichas de clientes que lleno el asistente de WhatsApp:
// corazza.com.do/api/panel/clientes. Las usan la calculadora (para cotizar
// arrastrando la ficha) y la herramienta de WhatsApp (para buscar al
// cliente). Protegido con la clave PANEL_CLAVE.
// POST { clave, buscar? } -> { conectado, clientes }
// "buscar" puede ser el codigo (0007 o #0007), el nombre o el telefono.
import { claveCorrecta } from "@/lib/clave.ts";
import { leerCodigo } from "@/lib/panel/codigo.ts";
import { baseDeDatos } from "@/lib/supabase.ts";

const LIMITE = 20;

type Datos = Partial<Record<"nombre" | "superficie" | "material" | "medidas" | "sector" | "notas", string | null>>;

export async function POST(request: Request) {
  if (!process.env.PANEL_CLAVE) return Response.json({ error: "El panel está apagado (falta PANEL_CLAVE)." }, { status: 503 });
  let cuerpo: { clave?: unknown; buscar?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: "Formato inválido." }, { status: 400 });
  }
  if (!claveCorrecta(cuerpo.clave, process.env.PANEL_CLAVE)) return Response.json({ error: "Clave incorrecta." }, { status: 401 });

  const db = baseDeDatos();
  if (!db) return Response.json({ conectado: false, clientes: [] });

  const buscar = typeof cuerpo.buscar === "string" ? cuerpo.buscar.trim().slice(0, 60) : "";
  let consulta = db.from("conversaciones").select("id, codigo, estado, datos, actualizado").order("actualizado", { ascending: false });
  if (buscar) {
    const codigo = leerCodigo(buscar);
    if (codigo !== null) {
      consulta = consulta.or(`codigo.eq.${codigo},id.ilike.*${codigo}*`);
    } else {
      // Se quitan los caracteres que tienen significado en el filtro.
      const limpio = buscar.replace(/[,()*%\\]/g, " ").trim();
      consulta = consulta.ilike("datos->>nombre", `%${limpio}%`);
    }
  }
  const { data, error } = await consulta.limit(buscar ? LIMITE : LIMITE * 3);
  if (error) {
    console.error("Clientes del panel:", error);
    return Response.json({ error: "No se pudo conectar con la base de datos." }, { status: 502 });
  }
  const clientes = (data ?? [])
    .map((f) => ({
      ...((f.datos ?? {}) as Datos),
      telefono: f.id as string,
      codigo: (f.codigo as number | null) ?? null,
      estado: f.estado as string,
      actualizado: f.actualizado as string,
    }))
    .filter((c) => buscar || c.superficie || c.medidas)
    .slice(0, LIMITE);
  return Response.json({ conectado: true, clientes });
}
