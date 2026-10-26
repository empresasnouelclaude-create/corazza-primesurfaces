"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Accion, Conversacion, DatosCliente } from "@/lib/asistente/tipos.ts";

type Burbuja =
  | { de: "cliente"; texto: string; imagen?: string }
  | { de: "asistente"; texto: string }
  | { de: "foto"; url: string; pie: string }
  | { de: "sistema"; texto: string };

const ETIQUETAS: Record<keyof DatosCliente, string> = {
  nombre: "Nombre",
  superficie: "Superficie",
  material: "Material",
  medidas: "Medidas",
  sector: "Sector",
  fecha_deseada: "Para cuándo",
  notas: "Notas",
};

const MOTIVOS: Record<string, string> = {
  listo_para_cotizar: "Listo para cotizar",
  pide_persona: "Pidió hablar con alguien",
  reclamo: "Reclamo",
  proyecto_grande: "Proyecto grande",
  otro: "Otro",
};

// Reduce la foto antes de enviarla (max 1280 px, JPG) para que el envio sea rapido.
async function prepararImagen(archivo: File): Promise<{ base64: string; mime: "image/jpeg"; vista: string }> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const vista = canvas.toDataURL("image/jpeg", 0.85);
  return { base64: vista.split(",")[1], mime: "image/jpeg", vista };
}

export default function Simulador() {
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState<{ base64: string; mime: "image/jpeg"; vista: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);
  // La clave se recuerda solo en esta pestaña (sessionStorage).
  const claveRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (claveRef.current) claveRef.current.value = sessionStorage.getItem("asistente-clave") ?? "";
    } catch {}
  }, []);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [burbujas, enviando]);

  function reiniciar() {
    setConversacion(null);
    setBurbujas([]);
    setError(null);
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (enviando || (!texto.trim() && !imagen)) return;
    setError(null);
    const clave = claveRef.current?.value ?? "";
    try {
      sessionStorage.setItem("asistente-clave", clave);
    } catch {}

    const mensaje = texto.trim();
    setBurbujas((b) => [...b, { de: "cliente", texto: mensaje, imagen: imagen?.vista }]);
    setTexto("");
    const imagenEnviada = imagen;
    setImagen(null);
    setEnviando(true);

    try {
      const res = await fetch("/api/asistente-prueba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clave,
          conversacion,
          texto: mensaje || null,
          imagen: imagenEnviada ? { base64: imagenEnviada.base64, mime: imagenEnviada.mime } : null,
        }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error ?? "Error del servidor.");

      const nuevas: Burbuja[] = (datos.respuestas as string[]).map((t) => ({ de: "asistente", texto: t }));
      for (const accion of datos.acciones as Accion[]) {
        if (accion.tipo === "enviar_fotos") accion.fotos.forEach((f) => nuevas.push({ de: "foto", url: f.url, pie: f.pie }));
        if (accion.tipo === "avisar_vendedor")
          nuevas.push({ de: "sistema", texto: `Pasado al vendedor · ${MOTIVOS[accion.motivo] ?? accion.motivo}: ${accion.resumen}` });
      }
      if ((datos.conversacion as Conversacion).estado === "vendedor" && nuevas.length === 0) {
        nuevas.push({ de: "sistema", texto: "La conversación la lleva el vendedor: el asistente ya no responde." });
      }
      setBurbujas((b) => [...b, ...nuevas]);
      setConversacion(datos.conversacion);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar.");
      setBurbujas((b) => b.slice(0, -1));
      setTexto(mensaje);
      setImagen(imagenEnviada);
    } finally {
      setEnviando(false);
    }
  }

  const datos = conversacion?.datos;

  return (
    <div className="min-h-screen bg-corazza-white">
      <header className="bg-corazza-charcoal px-4 py-4 text-corazza-white sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-corazza-serif text-2xl font-semibold tracking-[0.14em]">CORAZZA</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-corazza-cream">Asistente de WhatsApp · Simulador</p>
          </div>
          <button
            type="button"
            onClick={reiniciar}
            className="min-h-[44px] rounded-xl border border-corazza-white/25 px-4 text-sm font-semibold hover:bg-corazza-white/10"
          >
            Nueva conversación
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-corazza-charcoal/10 bg-white p-4 lg:col-span-2">
          <label htmlFor="clave" className="text-xs font-semibold uppercase tracking-[0.12em] text-corazza-taupe">
            Clave del simulador
          </label>
          <input
            id="clave"
            type="password"
            ref={claveRef}
            autoComplete="off"
            className="min-h-[44px] w-full max-w-xs rounded-xl border border-corazza-charcoal/15 px-3 text-base"
          />
        </div>
        <section aria-label="Conversación" className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-corazza-charcoal/10 bg-[#EFE7D8]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {burbujas.length === 0 && (
              <p className="mx-auto max-w-sm pt-10 text-center text-sm text-corazza-taupe">
                Escribe como si fueras un cliente. Por ejemplo: “Hola, quiero proteger la isla de mi cocina”.
              </p>
            )}
            {burbujas.map((b, i) => {
              if (b.de === "sistema")
                return (
                  <p key={i} className="mx-auto w-fit rounded-full bg-corazza-charcoal/80 px-3 py-1 text-center text-xs text-corazza-white">
                    {b.texto}
                  </p>
                );
              if (b.de === "foto")
                return (
                  <figure key={i} className="max-w-[75%] rounded-2xl rounded-tl-sm bg-white p-1.5 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.url} alt={b.pie} className="max-h-60 rounded-xl object-cover" />
                    <figcaption className="px-1.5 py-1 text-xs text-corazza-charcoal">{b.pie}</figcaption>
                  </figure>
                );
              const cliente = b.de === "cliente";
              return (
                <div
                  key={i}
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
                    cliente ? "ml-auto rounded-tr-sm bg-[#DCF3D6] text-[#1F2A1C]" : "rounded-tl-sm bg-white text-corazza-charcoal"
                  }`}
                >
                  {cliente && b.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imagen} alt="Foto enviada" className="mb-1.5 max-h-48 rounded-xl" />
                  )}
                  {b.texto}
                </div>
              );
            })}
            {enviando && <p className="w-fit rounded-2xl bg-white px-3.5 py-2 text-sm text-corazza-taupe shadow-sm">Escribiendo…</p>}
            <div ref={finRef} />
          </div>

          <form onSubmit={enviar} className="space-y-2 border-t border-corazza-charcoal/10 bg-corazza-white p-3">
            {imagen && (
              <div className="flex items-center gap-2 text-xs text-corazza-taupe">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagen.vista} alt="" className="h-10 w-10 rounded object-cover" />
                Foto lista para enviar
                <button type="button" onClick={() => setImagen(null)} className="underline">
                  Quitar
                </button>
              </div>
            )}
            {error && <p className="text-sm text-[#A3463A]">{error}</p>}
            <div className="flex gap-2">
              <label className="flex min-h-[44px] cursor-pointer items-center rounded-xl border border-corazza-charcoal/15 px-3 text-sm font-semibold">
                Foto
                <input
                  id="foto"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const archivo = e.target.files?.[0];
                    e.target.value = "";
                    if (archivo) setImagen(await prepararImagen(archivo));
                  }}
                />
              </label>
              <input
                id="mensaje"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe un mensaje"
                aria-label="Mensaje"
                className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-corazza-charcoal/15 bg-white px-3 text-base"
              />
              <button
                type="submit"
                disabled={enviando}
                className="min-h-[44px] rounded-xl bg-corazza-charcoal px-4 text-sm font-semibold text-corazza-white disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">

          <div className="rounded-2xl border border-corazza-charcoal/10 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-corazza-serif text-xl font-semibold">Ficha del cliente</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  conversacion?.estado === "vendedor" ? "bg-[#F5E8CC] text-[#9C6F22]" : "bg-[#E3EEDF] text-[#4C7A52]"
                }`}
              >
                {conversacion?.estado === "vendedor" ? "Con el vendedor" : "Asistente"}
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              {(Object.keys(ETIQUETAS) as (keyof DatosCliente)[]).map((campo) => (
                <div key={campo} className="flex justify-between gap-3 border-t border-corazza-charcoal/10 pt-2 first:border-0 first:pt-0">
                  <dt className="text-corazza-taupe">{ETIQUETAS[campo]}</dt>
                  <dd className="text-right font-medium">{datos?.[campo] ?? "—"}</dd>
                </div>
              ))}
            </dl>
            {conversacion?.pase && (
              <p className="mt-3 rounded-xl bg-[#F5E8CC] p-3 text-sm text-[#5C4314]">
                <strong>{MOTIVOS[conversacion.pase.motivo]}.</strong> {conversacion.pase.resumen}
              </p>
            )}
          </div>
          <p className="text-xs text-corazza-taupe">
            Esto es una prueba: no se envía nada por WhatsApp ni se guarda. Así se verá la ficha en el panel.
          </p>
        </aside>
      </main>
    </div>
  );
}
