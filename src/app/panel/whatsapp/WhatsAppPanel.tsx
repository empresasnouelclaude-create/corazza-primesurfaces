"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { coincide, formatoCodigo } from "@/lib/panel/codigo.ts";

type Remitente = { id: string; nombre: string; descripcion: string; variable: string; conectado: boolean };
type Estado = { token: boolean; plantillas: boolean; historial: boolean; remitentes: Remitente[] };
type Plantilla = { nombre: string; idioma: string; categoria: string; texto: string; variables: number; compatible: boolean };
type Cliente = { telefono: string; codigo: number | null; nombre: string | null; superficie: string | null; sector: string | null };
type Envio = {
  id: string;
  codigo: number | null;
  remitente: string;
  para: string;
  nombre: string | null;
  tipo: string;
  contenido: string;
  estado: "enviado" | "entregado" | "leido" | "fallido";
  error: string | null;
  creado: string;
};

const ESTADOS: Record<Envio["estado"], { texto: string; clase: string }> = {
  enviado: { texto: "Enviado", clase: "bg-corazza-cream/70 text-corazza-charcoal" },
  entregado: { texto: "Entregado", clase: "bg-[#E3EEDF] text-[#4C7A52]" },
  leido: { texto: "Leído", clase: "bg-[#E3EEDF] text-[#4C7A52]" },
  fallido: { texto: "No entregado", clase: "bg-[#F6E0DA] text-[#A3463A]" },
};

/** Texto de la plantilla con las variables llenas (para la vista previa). */
function vistaPrevia(texto: string, valores: string[]) {
  return texto.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => valores[Number(n) - 1] || `{{${n}}}`);
}

export default function WhatsAppPanel() {
  const parametros = useSearchParams();
  const claveRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error" | "info"; texto: string } | null>(null);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [envios, setEnvios] = useState<Envio[]>([]);

  const [remitente, setRemitente] = useState("corazza");
  const [telefono, setTelefono] = useState(parametros.get("tel") ?? "");
  const [nombre, setNombre] = useState(parametros.get("nombre") ?? "");
  const [modo, setModo] = useState<"texto" | "plantilla">("plantilla");
  const [texto, setTexto] = useState("");
  const [plantillaId, setPlantillaId] = useState("");
  const [variables, setVariables] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState<number | null>(null);
  const [buscarCliente, setBuscarCliente] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState("");

  const plantilla = useMemo(() => plantillas.find((p) => `${p.nombre}|${p.idioma}` === plantillaId) ?? null, [plantillas, plantillaId]);

  function clave() {
    const valor = claveRef.current?.value ?? "";
    try {
      sessionStorage.setItem("panel-clave", valor);
    } catch {}
    return valor;
  }

  async function api(cuerpo: Record<string, unknown>) {
    const res = await fetch("/api/panel/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave: clave(), ...cuerpo }),
    });
    const r = await res.json();
    if (!res.ok) throw new Error(r.error ?? "Error del servidor.");
    return r;
  }

  async function entrar() {
    if (!clave()) return;
    setAviso({ tipo: "info", texto: "Cargando…" });
    try {
      const e = (await api({ accion: "estado" })) as Estado;
      setEstado(e);
      const primero = e.remitentes.find((r) => r.conectado);
      if (primero) setRemitente(primero.id);
      setAviso(null);
      if (e.plantillas) {
        api({ accion: "plantillas" })
          .then((r) => setPlantillas(r.plantillas))
          .catch((x) => setAviso({ tipo: "error", texto: x.message }));
      }
      if (e.historial) cargarHistorial();
    } catch (x) {
      setEstado(null);
      setAviso({ tipo: "error", texto: x instanceof Error ? x.message : "No se pudo cargar." });
    }
  }

  function cargarHistorial() {
    api({ accion: "historial" })
      .then((r) => setEnvios(r.envios))
      .catch(() => {});
  }

  // Al abrir: si la clave ya se escribio en esta sesion, entrar solo.
  useEffect(() => {
    let guardada = "";
    try {
      guardada = sessionStorage.getItem("panel-clave") ?? "";
    } catch {}
    if (claveRef.current) claveRef.current.value = guardada;
    if (guardada) queueMicrotask(() => void entrar());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Buscar un cliente del asistente por codigo, nombre o telefono.
  useEffect(() => {
    const q = buscarCliente.trim();
    if (!estado || !q) {
      queueMicrotask(() => setResultados([]));
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await fetch("/api/panel/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clave: clave(), buscar: q }),
        });
        const r = await res.json();
        setResultados(res.ok ? (r.clientes as Cliente[]).slice(0, 6) : []);
      } catch {
        setResultados([]);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [buscarCliente, estado]);

  function elegirCliente(c: Cliente) {
    setTelefono(c.telefono);
    setNombre(c.nombre ?? "");
    setCodigo(c.codigo);
    setBuscarCliente("");
    setResultados([]);
  }

  async function enviar() {
    setEnviando(true);
    setAviso(null);
    try {
      const base = { accion: "enviar", remitente, para: telefono, nombre, codigo };
      const r =
        modo === "texto"
          ? await api({ ...base, tipo: "texto", texto })
          : await api({ ...base, tipo: "plantilla", plantilla: plantilla && { nombre: plantilla.nombre, idioma: plantilla.idioma }, variables });
      const desde = estado?.remitentes.find((x) => x.id === remitente)?.nombre ?? "";
      setAviso({ tipo: "ok", texto: `Mensaje enviado desde ${desde} a +${r.para}.` });
      if (modo === "texto") setTexto("");
      cargarHistorial();
    } catch (x) {
      setAviso({ tipo: "error", texto: x instanceof Error ? x.message : "No se pudo enviar." });
    } finally {
      setEnviando(false);
    }
  }

  const conectado = estado?.remitentes.find((r) => r.id === remitente)?.conectado ?? false;
  const listo =
    conectado &&
    telefono.trim() !== "" &&
    (modo === "texto" ? texto.trim() !== "" : !!plantilla && plantilla.compatible && variables.slice(0, plantilla.variables).every((v) => v.trim()));
  const campo = "min-h-[44px] w-full rounded-lg border border-corazza-charcoal/15 bg-white px-3 text-base";
  const fecha = (f: string) => new Date(f).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-corazza-white text-corazza-charcoal">
      <header className="bg-corazza-charcoal px-4 py-4 text-corazza-white sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-corazza-serif text-2xl font-semibold tracking-[0.14em]">CORAZZA</p>
            <nav aria-label="Panel" className="mt-0.5 flex gap-3 text-[11px] uppercase tracking-[0.2em] text-corazza-cream">
              <a href="/panel/documentos" className="hover:text-corazza-white">
                Documentos
              </a>
              <span aria-hidden>·</span>
              <span aria-current="page" className="text-corazza-white">
                WhatsApp
              </span>
            </nav>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void entrar();
            }}
          >
            <label htmlFor="clave" className="text-xs text-corazza-cream">
              Clave
            </label>
            <input id="clave" ref={claveRef} type="password" autoComplete="off" className="min-h-[40px] w-40 rounded-lg bg-corazza-white/10 px-3 text-base text-corazza-white" />
            <button type="submit" className="min-h-[40px] rounded-lg bg-corazza-cream px-3 text-sm font-semibold text-corazza-charcoal">
              Entrar
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8">
        {aviso && (
          <p
            role="status"
            className={`rounded-xl px-4 py-2.5 text-sm ${aviso.tipo === "error" ? "bg-[#F6E0DA] text-[#7A2E25]" : aviso.tipo === "ok" ? "bg-[#E3EEDF] text-[#2F5535]" : "bg-corazza-cream/60"}`}
          >
            {aviso.texto}
          </p>
        )}
        {!estado && !aviso && <p className="rounded-xl bg-corazza-cream/60 px-4 py-2.5 text-sm">Escribe la clave arriba y toca Entrar.</p>}

        {estado && (
          <>
            {/* Numeros conectados */}
            <section aria-labelledby="numeros" className="space-y-3">
              <h1 id="numeros" className="font-corazza-serif text-2xl font-semibold">
                Números de WhatsApp
              </h1>
              <div className="grid gap-3 sm:grid-cols-2">
                {estado.remitentes.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-corazza-charcoal/10 bg-white p-4">
                    <div className="min-w-0">
                      <p className="font-semibold">{r.nombre}</p>
                      <p className="text-sm text-corazza-taupe">{r.descripcion}</p>
                      {!r.conectado && (
                        <p className="mt-1 break-words text-xs text-corazza-taupe">
                          Para conectarlo: poner <code className="font-semibold">{estado.token ? r.variable : `WHATSAPP_TOKEN y ${r.variable}`}</code> en Vercel.
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.conectado ? "bg-[#E3EEDF] text-[#4C7A52]" : "bg-[#F5E8CC] text-[#9C6F22]"}`}
                    >
                      {r.conectado ? "Conectado" : "Falta conectar"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {/* Formulario */}
              <form
                aria-labelledby="escribir"
                className="space-y-4 rounded-2xl border border-corazza-charcoal/10 bg-white p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (listo && !enviando) void enviar();
                }}
              >
                <h2 id="escribir" className="font-corazza-serif text-2xl font-semibold">
                  Escribir a un cliente
                </h2>

                <fieldset>
                  <legend className="mb-1.5 text-sm font-semibold">Enviar desde</legend>
                  <div className="flex flex-wrap gap-2">
                    {estado.remitentes.map((r) => (
                      <label
                        key={r.id}
                        className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${remitente === r.id ? "border-corazza-charcoal bg-corazza-charcoal text-corazza-white" : "border-corazza-charcoal/15"} ${r.conectado ? "" : "cursor-not-allowed opacity-50"}`}
                      >
                        <input
                          type="radio"
                          name="remitente"
                          value={r.id}
                          checked={remitente === r.id}
                          disabled={!r.conectado}
                          onChange={() => setRemitente(r.id)}
                          className="sr-only"
                        />
                        {r.nombre}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="relative">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold">Buscar cliente</span>
                    <input
                      type="search"
                      value={buscarCliente}
                      onChange={(e) => setBuscarCliente(e.target.value)}
                      placeholder="Código, nombre o teléfono"
                      className={campo}
                    />
                  </label>
                  {resultados.length > 0 && (
                    <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-corazza-charcoal/15 bg-white shadow-lg">
                      {resultados.map((r) => (
                        <li key={r.telefono}>
                          <button type="button" onClick={() => elegirCliente(r)} className="flex w-full items-baseline gap-2 px-3 py-2.5 text-left text-sm hover:bg-corazza-cream/40">
                            {formatoCodigo(r.codigo) && <span className="text-xs font-semibold text-corazza-taupe">#{formatoCodigo(r.codigo)}</span>}
                            <span className="font-semibold">{r.nombre ?? `+${r.telefono}`}</span>
                            <span className="min-w-0 truncate text-xs text-corazza-taupe">{[r.superficie, r.sector].filter(Boolean).join(" · ")}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {codigo !== null && <p className="mt-1 text-xs text-corazza-taupe">Cliente #{formatoCodigo(codigo)}</p>}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold">Teléfono del cliente</span>
                    <input
                      value={telefono}
                      onChange={(e) => {
                        setTelefono(e.target.value);
                        setCodigo(null);
                      }} inputMode="tel" placeholder="809 555 0142" className={campo} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold">
                      Nombre <span className="font-normal text-corazza-taupe">(opcional)</span>
                    </span>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
                  </label>
                </div>

                <div role="tablist" aria-label="Tipo de mensaje" className="flex gap-1 rounded-lg bg-corazza-cream/40 p-1">
                  {(
                    [
                      ["plantilla", "Plantilla"],
                      ["texto", "Mensaje libre"],
                    ] as const
                  ).map(([id, t]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={modo === id}
                      onClick={() => setModo(id)}
                      className={`min-h-[40px] flex-1 rounded-md text-sm font-semibold ${modo === id ? "bg-white shadow-sm" : "text-corazza-taupe"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {modo === "texto" ? (
                  <div className="space-y-1.5">
                    <label className="block text-sm">
                      <span className="mb-1 block font-semibold">Mensaje</span>
                      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} className={`${campo} py-2`} />
                    </label>
                    <p className="text-xs text-corazza-taupe">
                      Solo llega si el cliente le escribió a ese número en las últimas 24 horas. Para escribirle primero, usa una plantilla.
                    </p>
                  </div>
                ) : !estado.plantillas ? (
                  <p className="rounded-lg bg-[#F5E8CC] px-3 py-2 text-sm text-[#5C4314]">
                    Para usar plantillas falta poner <code className="font-semibold">WHATSAPP_WABA_ID</code> en Vercel.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm">
                      <span className="mb-1 block font-semibold">Plantilla</span>
                      <select
                        value={plantillaId}
                        onChange={(e) => {
                          setPlantillaId(e.target.value);
                          setVariables([]);
                        }}
                        className={campo}
                      >
                        <option value="">{plantillas.length ? "Elige una plantilla" : "No hay plantillas aprobadas todavía"}</option>
                        {plantillas.map((p) => (
                          <option key={`${p.nombre}|${p.idioma}`} value={`${p.nombre}|${p.idioma}`} disabled={!p.compatible}>
                            {p.nombre.replaceAll("_", " ")} ({p.idioma}){p.compatible ? "" : " · no compatible"}
                          </option>
                        ))}
                      </select>
                    </label>
                    {plantilla && (
                      <>
                        {Array.from({ length: plantilla.variables }, (_, i) => (
                          <label key={i} className="block text-sm">
                            <span className="mb-1 block font-semibold">Dato {`{{${i + 1}}}`}</span>
                            <input
                              value={variables[i] ?? ""}
                              onChange={(e) =>
                                setVariables((v) => {
                                  const copia = [...v];
                                  copia[i] = e.target.value;
                                  return copia;
                                })
                              }
                              className={campo}
                            />
                          </label>
                        ))}
                        <div>
                          <p className="mb-1 text-sm font-semibold">Vista previa</p>
                          <p className="whitespace-pre-line rounded-xl bg-[#DCF3D6] px-3 py-2 text-[15px]">{vistaPrevia(plantilla.texto, variables)}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!listo || enviando}
                  className="min-h-[44px] w-full rounded-xl bg-corazza-charcoal px-5 text-sm font-semibold text-corazza-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {enviando ? "Enviando…" : "Enviar por WhatsApp"}
                </button>
                {!conectado && <p className="text-center text-xs text-corazza-taupe">Ese número todavía no está conectado.</p>}
              </form>

              {/* Historial */}
              <section aria-labelledby="historial" className="min-w-0 rounded-2xl border border-corazza-charcoal/10 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-corazza-charcoal/10 px-5 py-4">
                  <h2 id="historial" className="font-corazza-serif text-2xl font-semibold">
                    Enviados
                  </h2>
                  {envios.length > 0 && (
                    <input
                      type="search"
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      placeholder="Buscar por código o nombre"
                      aria-label="Buscar en enviados"
                      className="min-h-[40px] w-full rounded-lg border border-corazza-charcoal/15 px-3 text-base sm:w-56"
                    />
                  )}
                </div>
                {!estado.historial ? (
                  <p className="px-5 py-8 text-center text-sm text-corazza-taupe">El historial se guarda cuando la base de datos esté conectada.</p>
                ) : envios.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-corazza-taupe">Todavía no se ha enviado nada desde el panel.</p>
                ) : (
                  <ul className="divide-y divide-corazza-charcoal/5">
                    {envios.filter((e) => coincide(filtro, { codigo: e.codigo, nombre: e.nombre, telefono: e.para })).map((e) => (
                      <li key={e.id} className="space-y-1 px-5 py-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">
                            {formatoCodigo(e.codigo) && <span className="mr-1.5 text-xs text-corazza-taupe">#{formatoCodigo(e.codigo)}</span>}
                            {e.nombre ?? `+${e.para}`}
                            <span className="font-normal text-corazza-taupe">
                              {" "}
                              · desde {estado.remitentes.find((r) => r.id === e.remitente)?.nombre ?? e.remitente}
                            </span>
                          </p>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADOS[e.estado]?.clase ?? ""}`}>{ESTADOS[e.estado]?.texto ?? e.estado}</span>
                        </div>
                        <p className="line-clamp-2 break-words text-corazza-taupe">{e.contenido}</p>
                        {e.error && <p className="text-xs text-[#A3463A]">{e.error}</p>}
                        <p className="text-xs text-corazza-taupe">{fecha(e.creado)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
