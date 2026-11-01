"use client";

// Ultimas fichas de clientes que lleno el asistente de WhatsApp. Se
// arrastran (o se tocan) para llenar la calculadora con el cliente y sus
// medidas. Pide la clave del panel porque tiene datos de clientes.
import { useEffect, useRef, useState } from "react";
import { PROVINCIAS } from "./config.ts";
import { leerSuperficies, type SuperficieLeida } from "./medidas.ts";

export type Ficha = {
  telefono: string;
  nombre: string | null;
  superficie: string | null;
  material: string | null;
  medidas: string | null;
  sector: string | null;
  notas?: string | null;
  actualizado: string;
  ejemplo?: boolean;
};

export type DatosFicha = { client: string; surfaces: SuperficieLeida[]; province: string | null };

export const TIPO_ARRASTRE = "application/x-corazza-ficha";

/** Ficha de ejemplo para probar mientras no hay clientes reales. */
export const FICHA_EJEMPLO: Ficha = {
  telefono: "18095550142",
  nombre: "Laura Méndez (ejemplo)",
  superficie: "mesa de comedor y mesa de centro",
  material: "mármol",
  medidas: "comedor 72 x 40 in; centro 48 x 24 in",
  sector: "Santiago, Los Jardines",
  actualizado: new Date().toISOString(),
  ejemplo: true,
};

/** Provincia que aparece en el texto de ciudad y sector (la mas larga que coincida). */
export function provinciaDe(sector: string | null): string | null {
  if (!sector) return null;
  const t = sector.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const sin = (p: string) => p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return [...PROVINCIAS].sort((a, b) => b.length - a.length).find((p) => t.includes(sin(p))) ?? null;
}

export function datosDeFicha(f: Ficha): DatosFicha {
  return { client: f.nombre ?? `+${f.telefono}`, surfaces: leerSuperficies(f.medidas, f.superficie), province: provinciaDe(f.sector) };
}

const fecha = (f: string) => new Date(f).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });

export default function FichasClientes({ onUsar }: { onUsar: (f: Ficha) => void }) {
  const claveRef = useRef<HTMLInputElement>(null);
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [conectado, setConectado] = useState(true);

  async function cargar(silencioso = false) {
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
        body: JSON.stringify({ clave }),
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
  }, []);

  const lista = [...(fichas ?? []), FICHA_EJEMPLO];

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
        {lista.map((f) => (
          <li
            key={f.telefono + (f.ejemplo ? "-ej" : "")}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(TIPO_ARRASTRE, JSON.stringify(f));
              e.dataTransfer.effectAllowed = "copy";
            }}
            className={`w-64 flex-shrink-0 cursor-grab rounded-xl border p-3 font-corazza-sans text-sm text-corazza-charcoal active:cursor-grabbing ${f.ejemplo ? "border-dashed border-corazza-charcoal/30 bg-corazza-cream/30" : "border-corazza-charcoal/15 bg-white shadow-sm"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 font-semibold">{f.nombre ?? `+${f.telefono}`}</p>
              {f.ejemplo ? (
                <span className="shrink-0 rounded-full bg-corazza-cream px-2 py-0.5 text-[11px] font-semibold">Ejemplo</span>
              ) : (
                <span className="shrink-0 text-[11px] text-corazza-taupe">{fecha(f.actualizado)}</span>
              )}
            </div>
            <dl className="mt-2 space-y-0.5 text-[13px]">
              {[
                ["Superficie", f.superficie],
                ["Material", f.material],
                ["Medidas", f.medidas],
                ["Ciudad / sector", f.sector],
              ].map(([t, v]) =>
                v ? (
                  <div key={t} className="flex gap-1.5">
                    <dt className="shrink-0 text-corazza-taupe">{t}:</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            <button
              type="button"
              onClick={() => onUsar(f)}
              className="mt-3 h-9 w-full rounded-lg border border-corazza-charcoal/30 text-[13px] font-semibold hover:bg-corazza-cream/40"
            >
              Usar en la calculadora
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
