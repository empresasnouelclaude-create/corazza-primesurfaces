"use client";

// Ultimas fichas de clientes que lleno el asistente de WhatsApp. Se
// arrastran (o se tocan) para llenar la calculadora con el cliente y sus
// medidas. Pide la clave del panel porque tiene datos de clientes.
import { useEffect, useRef, useState } from "react";
import { coincide, formatoCodigo } from "@/lib/panel/codigo.ts";
import { PROVINCIAS } from "./config.ts";
import { leerSuperficies, type SuperficieLeida } from "./medidas.ts";

export type Ficha = {
  telefono: string;
  /** Codigo secuencial del cliente (se muestra como 0007). */
  codigo: number | null;
  nombre: string | null;
  superficie: string | null;
  material: string | null;
  medidas: string | null;
  sector: string | null;
  notas?: string | null;
  actualizado: string;
  ejemplo?: boolean;
};

export type DatosFicha = { client: string; code: string | null; surfaces: SuperficieLeida[]; province: string | null };

export const TIPO_ARRASTRE = "application/x-corazza-ficha";

/** Fichas de ejemplo para probar (casos distintos de medidas). */
const ahora = new Date().toISOString();
export const FICHAS_EJEMPLO: Ficha[] = [
  {
    telefono: "18095550142",
    codigo: null,
    nombre: "Laura Méndez",
    superficie: "mesa de comedor y mesa de centro",
    material: "mármol",
    medidas: "comedor 72 x 40 in; centro 48 x 24 in",
    sector: "Santiago, Los Jardines",
    actualizado: ahora,
    ejemplo: true,
  },
  {
    telefono: "18295550199",
    codigo: null,
    nombre: "Carlos Peña",
    superficie: "mesa de comedor redonda",
    material: "granito",
    medidas: "redonda de 120 cm de diámetro",
    sector: "Santo Domingo, Piantini",
    actualizado: ahora,
    ejemplo: true,
  },
  {
    telefono: "18495550123",
    codigo: null,
    nombre: "María Rosario",
    superficie: "recibidor",
    material: "cuarzo",
    medidas: "1.20 x 0.40 m",
    sector: "Punta Cana, La Altagracia",
    actualizado: ahora,
    ejemplo: true,
  },
  {
    telefono: "18095550177",
    codigo: null,
    nombre: "José Almonte",
    superficie: "mesa de centro",
    material: "travertino",
    medidas: "60 x 30",
    sector: "La Romana",
    actualizado: ahora,
    ejemplo: true,
  },
];

/** Provincia que aparece en el texto de ciudad y sector (la mas larga que coincida). */
export function provinciaDe(sector: string | null): string | null {
  if (!sector) return null;
  const t = sector.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const sin = (p: string) => p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return [...PROVINCIAS].sort((a, b) => b.length - a.length).find((p) => t.includes(sin(p))) ?? null;
}

export function datosDeFicha(f: Ficha): DatosFicha {
  return {
    client: f.nombre ?? `+${f.telefono}`,
    code: formatoCodigo(f.codigo),
    surfaces: leerSuperficies(f.medidas, f.superficie),
    province: provinciaDe(f.sector),
  };
}

const fecha = (f: string) => new Date(f).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });

export default function FichasClientes({ onUsar }: { onUsar: (f: Ficha) => void }) {
  const claveRef = useRef<HTMLInputElement>(null);
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conectado, setConectado] = useState(true);

  const [buscar, setBuscar] = useState("");

  async function cargar(silencioso = false, texto = buscar) {
    const clave = claveRef.current?.value ?? "";
    if (!clave) return;
    try {
      sessionStorage.setItem("panel-clave", clave);
    } catch {}
    if (!silencioso) setAviso("Cargando…");
    try {
      const res = await fetch("/api/panel/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, buscar: texto }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error ?? "Error del servidor.");
      setFichas(r.clientes);
      setConectado(r.conectado);
      setAviso(null);
    } catch (e) {
      if (!silencioso) setAviso(e instanceof Error ? e.message : "No se pudo cargar.");
    }
  }

  // Si la clave ya se escribio en esta sesion, carga solo y se actualiza
  // cada minuto con los clientes nuevos que atiende el asistente.
  useEffect(() => {
    let clave = "";
    try {
      clave = sessionStorage.getItem("panel-clave") ?? "";
    } catch {}
    if (claveRef.current) claveRef.current.value = clave;
    if (!clave) return;
    queueMicrotask(() => void cargar());
    const id = setInterval(() => void cargar(true), 60_000);
    return () => clearInterval(id);
    // Solo al abrir la pagina.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al buscar, se pregunta a la base de datos (encuentra clientes antiguos).
  useEffect(() => {
    if (fichas === null) return;
    const id = setTimeout(() => void cargar(true, buscar), 300);
    return () => clearTimeout(id);
    // Solo cuando cambia lo buscado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar]);

  const lista = [...(fichas ?? []), ...FICHAS_EJEMPLO.filter((f) => coincide(buscar, f))];

  return (
    <section aria-labelledby="fichas-titulo" className="rounded-2xl border border-corazza-charcoal/15 bg-corazza-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="fichas-titulo" className="font-corazza-serif text-2xl font-medium text-corazza-charcoal sm:text-[1.75rem]">
            Clientes de WhatsApp
          </h2>
          <p className="mt-1 font-corazza-sans text-sm text-corazza-taupe">Arrastra una ficha a la calculadora (o toca “Usar”) y se llenan el cliente y las medidas.</p>
        </div>
        {fichas === null && (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void cargar();
            }}
          >
            <label htmlFor="fichas-clave" className="font-corazza-sans text-xs text-corazza-taupe">
              Clave del panel
            </label>
            <input id="fichas-clave" ref={claveRef} type="password" autoComplete="off" className="h-10 w-32 rounded-lg border border-corazza-charcoal/30 px-3 text-base" />
            <button type="submit" className="h-10 rounded-lg bg-corazza-charcoal px-3 font-corazza-sans text-sm font-semibold text-corazza-white">
              Ver
            </button>
          </form>
        )}
      </div>
      <label className="mt-4 block max-w-sm">
        <span className="sr-only">Buscar cliente</span>
        <input
          type="search"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por código, nombre o teléfono"
          className="h-11 w-full rounded-lg border border-corazza-charcoal/30 bg-white px-3 font-corazza-sans text-base"
        />
      </label>
      {aviso && (
        <p role="status" className="mt-3 font-corazza-sans text-sm text-corazza-taupe">
          {aviso}
        </p>
      )}
      {fichas !== null && !conectado && (
        <p className="mt-3 font-corazza-sans text-sm text-corazza-taupe">Las fichas reales aparecen cuando la base de datos y el WhatsApp estén conectados.</p>
      )}
      {fichas !== null && conectado && fichas.length === 0 && (
        <p className="mt-3 font-corazza-sans text-sm text-corazza-taupe">Todavía no hay clientes con medidas.</p>
      )}

      <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {lista.length === 0 && <li className="py-4 font-corazza-sans text-sm text-corazza-taupe">No hay clientes con ese código o nombre.</li>}
        {lista.map((f) => (
          <li
            key={`${f.codigo ?? f.telefono}${f.ejemplo ? "-ej" : ""}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(TIPO_ARRASTRE, JSON.stringify(f));
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="flex w-60 flex-shrink-0 cursor-grab flex-col rounded-2xl bg-white p-4 font-corazza-sans text-corazza-charcoal shadow-[0_1px_3px_rgba(43,33,26,0.06)] ring-1 ring-corazza-charcoal/10 transition-shadow hover:shadow-[0_6px_20px_rgba(43,33,26,0.10)] hover:ring-corazza-charcoal/20 active:cursor-grabbing"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.14em] text-corazza-taupe">
              <span>{f.ejemplo ? "EJEMPLO" : formatoCodigo(f.codigo) ? `#${formatoCodigo(f.codigo)}` : ""}</span>
              <span aria-hidden className="text-base leading-none tracking-normal text-corazza-taupe/60">⠿</span>
            </div>
            <p className="mt-1 font-corazza-serif text-xl font-medium leading-tight">{f.nombre ?? `+${f.telefono}`}</p>
            <p className="mt-2 line-clamp-2 text-[13px] text-corazza-charcoal/80">
              {[f.superficie, f.material].filter(Boolean).join(" · ")}
            </p>
            {f.medidas && <p className="mt-0.5 text-[13px] font-medium tabular-nums">{f.medidas}</p>}
            <div aria-hidden className="min-h-3 flex-1" />
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-corazza-charcoal/10 pt-3">
              <span className="min-w-0 truncate text-[12px] text-corazza-taupe">{f.sector ?? (f.ejemplo ? "" : fecha(f.actualizado))}</span>
              <button
                type="button"
                onClick={() => onUsar(f)}
                aria-label={`Usar la ficha de ${f.nombre ?? f.telefono} en la calculadora`}
                className="shrink-0 rounded-full bg-corazza-charcoal px-3 py-1.5 text-[12px] font-semibold text-corazza-white hover:bg-corazza-charcoal/90"
              >
                Usar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
