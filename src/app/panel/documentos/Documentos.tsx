"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { resumen, saldoDe, unirDocumentos } from "@/lib/citrus/resumen.ts";
import type { DocumentoGuardado, EstadoPago, LecturaPDF, ProductoInventario } from "@/lib/citrus/tipos.ts";

// Con la base de datos conectada (Supabase), los documentos y los PDF se
// guardan en el servidor y los ve cualquiera que entre con la clave.
// Sin ella (modo de prueba), los datos se guardan solo en este navegador
// (localStorage) y los PDF solo se pueden ver durante la sesion.
const CLAVE_DATOS = "corazza-panel-citrus";
const MAX_BYTES = 3 * 1024 * 1024;

type Datos = { documentos: DocumentoGuardado[]; inventario: ProductoInventario[]; inventarioFecha: string | null };
type Subida = { nombre: string; estado: "leyendo" | "ok" | "error"; mensaje: string };
type Pestana = "facturas" | "cotizaciones" | "cobrar" | "inventario";

const VACIO: Datos = { documentos: [], inventario: [], inventarioFecha: null };

const rd = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", minimumFractionDigits: 2 });
const dinero = (n: number | null) => (n === null ? "—" : rd.format(n).replace("DOP", "RD$"));
const fecha = (f: string | null) => (f ? new Date(`${f}T12:00:00`).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const ESTADOS: Record<EstadoPago, { texto: string; clase: string }> = {
  pagada: { texto: "Pagada", clase: "bg-[#E3EEDF] text-[#4C7A52]" },
  parcial: { texto: "Pago parcial", clase: "bg-[#F5E8CC] text-[#9C6F22]" },
  pendiente: { texto: "Pendiente", clase: "bg-[#F5E8CC] text-[#9C6F22]" },
  vencida: { texto: "Vencida", clase: "bg-[#F6E0DA] text-[#A3463A]" },
  desconocido: { texto: "—", clase: "bg-corazza-cream/60 text-corazza-taupe" },
};

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const sinAcentos = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Busca por cliente, numero, NCF o notas. El codigo de cliente (0007) se
 * encuentra si se escribio en la cotizacion o factura de Citrus.
 */
function coincideDocumento(q: string, d: DocumentoGuardado): boolean {
  const t = sinAcentos(q.trim().replace(/^#/, ""));
  if (!t) return true;
  return [d.cliente.nombre, d.numero, d.ncf, d.notas, d.cliente.telefono].some((v) => v && sinAcentos(v).includes(t));
}

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function leerArchivo(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(",")[1] ?? "");
    lector.onerror = () => reject(new Error("No se pudo abrir el archivo."));
    lector.readAsDataURL(archivo);
  });
}

export default function Documentos() {
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [subidas, setSubidas] = useState<Subida[]>([]);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [mes, setMes] = useState<string>(mesActual());
  const [pestana, setPestana] = useState<Pestana>("facturas");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [buscar, setBuscar] = useState("");
  const claveRef = useRef<HTMLInputElement>(null);
  const [pdfs, setPdfs] = useState<Record<string, string>>({}); // archivo -> URL temporal del PDF
  // null: aun no se sabe; true: base de datos; false: modo de prueba (navegador).
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function guardarClave() {
    const clave = claveRef.current?.value ?? "";
    try {
      sessionStorage.setItem("panel-clave", clave);
    } catch {}
    return clave;
  }

  function cargarDelNavegador() {
    try {
      const guardado = localStorage.getItem(CLAVE_DATOS);
      setDatos(guardado ? { ...VACIO, ...(JSON.parse(guardado) as Datos) } : VACIO);
    } catch {
      setDatos(VACIO);
    }
  }

  async function entrar() {
    const clave = guardarClave();
    if (!clave) return;
    setAviso("Cargando…");
    try {
      const res = await fetch("/api/panel/datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error ?? "Error del servidor.");
      if (r.conectado) {
        setDatos({ ...VACIO, ...r.datos });
        setConectado(true);
      } else {
        cargarDelNavegador();
        setConectado(false);
      }
      setAviso(null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo cargar.");
    }
  }

  // Al abrir: si la clave ya se escribio en esta sesion, entrar solo.
  useEffect(() => {
    let clave = "";
    try {
      clave = sessionStorage.getItem("panel-clave") ?? "";
    } catch {}
    if (claveRef.current) claveRef.current.value = clave;
    if (clave) queueMicrotask(() => void entrar());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // En modo de prueba, lo leido se guarda en este navegador.
  useEffect(() => {
    if (conectado !== false) return;
    try {
      localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
    } catch {}
  }, [datos, conectado]);

  async function verPDF(ruta: string) {
    const ventana = window.open("", "_blank");
    try {
      const res = await fetch("/api/panel/datos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: guardarClave(), pdf: ruta }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      if (ventana) ventana.location.href = r.url;
      else window.location.href = r.url;
    } catch {
      ventana?.close();
      setAviso("No se pudo abrir el PDF.");
    }
  }

  const [desde, hasta] = mes === "todo" ? [undefined, undefined] : [`${mes}-01`, `${mes}-31`];
  const totales = useMemo(() => resumen(datos.documentos, desde, hasta), [datos.documentos, desde, hasta]);
  const enRango = (f: string | null) => !desde || ((f ?? "") >= desde && (f ?? "9999") <= hasta!);
  const ordenar = (a: DocumentoGuardado, b: DocumentoGuardado) => (b.fecha ?? "").localeCompare(a.fecha ?? "");
  const facturas = datos.documentos.filter((d) => d.tipo === "factura" && enRango(d.fecha) && coincideDocumento(buscar, d)).sort(ordenar);
  const cotizaciones = datos.documentos.filter((d) => d.tipo === "cotizacion" && enRango(d.fecha) && coincideDocumento(buscar, d)).sort(ordenar);
  const deudores = totales.deudores.filter((d) => !buscar.trim() || sinAcentos(d.cliente).includes(sinAcentos(buscar.trim())));
  const meses = [...new Set(datos.documentos.map((d) => d.fecha?.slice(0, 7)).filter(Boolean) as string[])].sort().reverse();
  if (!meses.includes(mesActual())) meses.unshift(mesActual());

  async function subir(archivos: File[]) {
    const clave = guardarClave();
    if (conectado === null) await entrar();
    setAdvertencias([]);
    for (const archivo of archivos) {
      const nombre = archivo.name;
      const actualizar = (s: Partial<Subida>) =>
        setSubidas((lista) => lista.map((x) => (x.nombre === nombre ? { ...x, ...s } : x)));
      setSubidas((lista) => [{ nombre, estado: "leyendo", mensaje: "Leyendo el documento…" }, ...lista.filter((x) => x.nombre !== nombre)]);

      if (archivo.type !== "application/pdf") {
        actualizar({ estado: "error", mensaje: "No es un PDF." });
        continue;
      }
      if (archivo.size > MAX_BYTES) {
        actualizar({ estado: "error", mensaje: "Pesa más de 3 MB." });
        continue;
      }
      try {
        const res = await fetch("/api/panel/citrus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clave, nombre, pdf: await leerArchivo(archivo) }),
        });
        const r = await res.json();
        if (!res.ok) throw new Error(r.error ?? "Error del servidor.");
        const lectura = r.lectura as LecturaPDF;
        const nuevos = lectura.documentos;
        if (r.datos) {
          // Guardado en la base de datos: se muestra lo que quedo guardado.
          setDatos({ ...VACIO, ...(r.datos as Datos) });
          setConectado(true);
        } else {
          const subido = new Date().toISOString();
          const guardados: DocumentoGuardado[] = nuevos.map((d) => ({ ...d, id: crypto.randomUUID(), archivo: nombre, subido }));
          const url = URL.createObjectURL(archivo);
          setPdfs((m) => ({ ...m, [nombre]: url }));
          setDatos((prev) => ({
            documentos: unirDocumentos(prev.documentos, guardados),
            inventario: lectura.inventario.length ? lectura.inventario : prev.inventario,
            inventarioFecha: lectura.inventario.length ? subido : prev.inventarioFecha,
          }));
        }
        setAdvertencias((a) => [...a, ...lectura.advertencias.map((t) => `${nombre}: ${t}`)]);
        const partes = [
          nuevos.length && `${nuevos.length} documento${nuevos.length === 1 ? "" : "s"}`,
          lectura.inventario.length && `${lectura.inventario.length} productos de inventario`,
        ].filter(Boolean);
        actualizar({ estado: "ok", mensaje: partes.length ? `Leído: ${partes.join(" y ")}.` : "No se encontraron datos." });
      } catch (e) {
        actualizar({ estado: "error", mensaje: e instanceof Error ? e.message : "No se pudo leer." });
      }
    }
  }

  function alSoltar(e: DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    subir([...e.dataTransfer.files]);
  }

  function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const archivos = [...(e.target.files ?? [])];
    e.target.value = "";
    if (archivos.length) subir(archivos);
  }

  const detalle = datos.documentos.find((d) => d.id === abierto) ?? null;

  const tabla = (lista: DocumentoGuardado[], vacio: string, conSaldo: boolean) =>
    lista.length === 0 ? (
      <p className="px-4 py-10 text-center text-sm text-corazza-taupe">{vacio}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-corazza-charcoal/10 text-left text-[11px] uppercase tracking-[0.1em] text-corazza-taupe">
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Número</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              {conSaldo && <th className="px-4 py-3 text-right font-semibold">Saldo</th>}
              {conSaldo && <th className="px-4 py-3 font-semibold">Estado</th>}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {lista.map((d) => (
              <tr
                key={d.id}
                onClick={() => setAbierto(d.id)}
                className={`cursor-pointer border-b border-corazza-charcoal/5 hover:bg-corazza-cream/30 ${abierto === d.id ? "bg-corazza-cream/40" : ""}`}
              >
                <td className="whitespace-nowrap px-4 py-3">{fecha(d.fecha)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  <button type="button" className="underline-offset-2 hover:underline" onClick={() => setAbierto(d.id)}>
                    {d.numero ?? d.ncf ?? "Sin número"}
                  </button>
                </td>
                <td className="px-4 py-3">{d.cliente.nombre ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{dinero(d.total)}</td>
                {conSaldo && <td className="whitespace-nowrap px-4 py-3 text-right">{dinero(saldoDe(d))}</td>}
                {conSaldo && (
                  <td className="px-4 py-3">
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADOS[d.estado].clase}`}>{ESTADOS[d.estado].texto}</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const pestanas: { id: Pestana; texto: string; n: number }[] = [
    { id: "facturas", texto: "Facturas", n: facturas.length },
    { id: "cotizaciones", texto: "Cotizaciones", n: cotizaciones.length },
    { id: "cobrar", texto: "Por cobrar", n: deudores.length },
    { id: "inventario", texto: "Inventario", n: datos.inventario.length },
  ];

  return (
    <div className="min-h-screen bg-corazza-white text-corazza-charcoal">
      <header className="bg-corazza-charcoal px-4 py-4 text-corazza-white sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-corazza-serif text-2xl font-semibold tracking-[0.14em]">CORAZZA</p>
            <nav aria-label="Panel" className="mt-0.5 flex gap-3 text-[11px] uppercase tracking-[0.2em] text-corazza-cream">
              <span aria-current="page" className="text-corazza-white">
                Documentos
              </span>
              <span aria-hidden>·</span>
              <a href="/panel/whatsapp" className="hover:text-corazza-white">
                WhatsApp
              </a>
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
          <p role="status" className="rounded-xl bg-corazza-cream/60 px-4 py-2.5 text-sm">
            {aviso}
          </p>
        )}
        {conectado === null && !aviso && (
          <p className="rounded-xl bg-corazza-cream/60 px-4 py-2.5 text-sm">Escribe la clave arriba y toca Entrar para ver los documentos.</p>
        )}
        {conectado === false && (
          <p className="rounded-xl bg-[#F5E8CC] px-4 py-2.5 text-sm text-[#5C4314]">
            Versión de prueba: los datos se guardan solo en este navegador hasta conectar la base de datos del panel.
          </p>
        )}

        {/* Subir PDF */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={alSoltar}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${arrastrando ? "border-corazza-taupe bg-corazza-cream/40" : "border-corazza-charcoal/15 bg-white"}`}
        >
          <h1 className="font-corazza-serif text-2xl font-semibold">Subir PDF de Citrus</h1>
          <p className="mt-1 text-sm text-corazza-taupe">Cotizaciones, facturas, cuentas por cobrar o inventario. Puedes subir varios a la vez.</p>
          <label className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center rounded-xl bg-corazza-charcoal px-5 text-sm font-semibold text-corazza-white hover:bg-corazza-charcoal/90">
            Elegir PDF
            <input id="pdf" type="file" accept="application/pdf" multiple className="sr-only" onChange={alElegir} />
          </label>
          {subidas.length > 0 && (
            <ul className="mx-auto mt-4 max-w-xl space-y-1.5 text-left text-sm" aria-live="polite">
              {subidas.map((s) => (
                <li key={s.nombre} className="flex gap-2">
                  <span aria-hidden className={s.estado === "ok" ? "text-[#4C7A52]" : s.estado === "error" ? "text-[#A3463A]" : "text-corazza-taupe"}>
                    {s.estado === "ok" ? "✓" : s.estado === "error" ? "✕" : "…"}
                  </span>
                  <span className="min-w-0 truncate font-medium">{s.nombre}</span>
                  <span className="text-corazza-taupe">{s.mensaje}</span>
                </li>
              ))}
            </ul>
          )}
          {advertencias.length > 0 && (
            <ul className="mx-auto mt-3 max-w-xl list-disc space-y-1 pl-5 text-left text-sm text-[#9C6F22]">
              {advertencias.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </section>

        {/* Resumen */}
        <section aria-labelledby="resumen-titulo" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="resumen-titulo" className="font-corazza-serif text-2xl font-semibold">
              Resumen
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-corazza-taupe">Periodo</span>
              <select id="periodo" value={mes} onChange={(e) => setMes(e.target.value)} className="min-h-[40px] rounded-lg border border-corazza-charcoal/15 bg-white px-2">
                {meses.map((m) => (
                  <option key={m} value={m}>
                    {new Date(`${m}-15T12:00:00`).toLocaleDateString("es-DO", { month: "long", year: "numeric" })}
                  </option>
                ))}
                <option value="todo">Todo</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { t: "Cotizado", v: totales.cotizado, d: plural(totales.cotizaciones, "cotización", "cotizaciones") },
              { t: "Facturado", v: totales.facturado, d: plural(totales.facturas, "factura", "facturas") },
              { t: "Cobrado", v: totales.cobrado, d: "De lo facturado en el periodo" },
              { t: "Por cobrar", v: totales.porCobrar, d: `${plural(totales.deudores.length, "cliente", "clientes")} · a hoy` },
            ].map((k) => (
              <div key={k.t} className="rounded-xl border border-corazza-charcoal/10 bg-white p-4">
                <p className="text-xs font-semibold text-corazza-taupe">{k.t}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{dinero(k.v)}</p>
                <p className="mt-0.5 text-xs text-corazza-taupe">{k.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Listas */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 rounded-2xl border border-corazza-charcoal/10 bg-white">
            <div className="border-b border-corazza-charcoal/10 p-2">
              <input
                type="search"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por cliente, número o código"
                aria-label="Buscar documentos"
                className="min-h-[40px] w-full rounded-lg border border-corazza-charcoal/15 px-3 text-base sm:max-w-xs"
              />
            </div>
            <div role="tablist" aria-label="Documentos" className="flex gap-1 overflow-x-auto border-b border-corazza-charcoal/10 p-2">
              {pestanas.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  type="button"
                  aria-selected={pestana === p.id}
                  onClick={() => setPestana(p.id)}
                  className={`min-h-[40px] whitespace-nowrap rounded-lg px-3 text-sm font-semibold ${pestana === p.id ? "bg-corazza-charcoal text-corazza-white" : "text-corazza-taupe hover:bg-corazza-cream/40"}`}
                >
                  {p.texto} <span className="opacity-70">{p.n}</span>
                </button>
              ))}
            </div>
            {pestana === "facturas" && tabla(facturas, "No hay facturas en este periodo. Sube un PDF de Citrus.", true)}
            {pestana === "cotizaciones" && tabla(cotizaciones, "No hay cotizaciones en este periodo.", false)}
            {pestana === "cobrar" &&
              (deudores.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-corazza-taupe">No hay saldos pendientes.</p>
              ) : (
                <ul className="divide-y divide-corazza-charcoal/5">
                  {deudores.map((d) => (
                    <li key={d.cliente} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold">{d.cliente}</p>
                        <p className="text-xs text-corazza-taupe">{d.facturas} factura{d.facturas === 1 ? "" : "s"} con saldo</p>
                      </div>
                      <p className="font-semibold tabular-nums">{dinero(d.saldo)}</p>
                    </li>
                  ))}
                </ul>
              ))}
            {pestana === "inventario" &&
              (datos.inventario.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-corazza-taupe">Sube el reporte de inventario de Citrus para verlo aquí.</p>
              ) : (
                <div className="overflow-x-auto">
                  <p className="px-4 pt-3 text-xs text-corazza-taupe">
                    Según el último reporte, subido el {new Date(datos.inventarioFecha!).toLocaleDateString("es-DO")}.
                  </p>
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-corazza-charcoal/10 text-left text-[11px] uppercase tracking-[0.1em] text-corazza-taupe">
                        <th className="px-4 py-3 font-semibold">Producto</th>
                        <th className="px-4 py-3 font-semibold">Código</th>
                        <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                        <th className="px-4 py-3 text-right font-semibold">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {datos.inventario.map((p, i) => (
                        <tr key={i} className="border-b border-corazza-charcoal/5">
                          <td className="px-4 py-3">{p.producto}</td>
                          <td className="px-4 py-3">{p.codigo ?? "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {p.cantidad ?? "—"} {p.unidad ?? ""}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">{dinero(p.costo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>

          {/* Detalle */}
          <aside className="rounded-2xl border border-corazza-charcoal/10 bg-white p-4" aria-live="polite">
            {!detalle ? (
              <p className="py-6 text-center text-sm text-corazza-taupe">Toca un documento para ver el detalle.</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-corazza-taupe">
                    {detalle.tipo === "cotizacion" ? "Cotización" : detalle.tipo === "factura" ? "Factura" : "Documento"}
                  </p>
                  <h3 className="font-corazza-serif text-2xl font-semibold">{detalle.numero ?? detalle.ncf ?? "Sin número"}</h3>
                  <p className="text-corazza-taupe">
                    {detalle.cliente.nombre ?? "Sin cliente"} · {fecha(detalle.fecha)}
                  </p>
                </div>
                {detalle.lineas.length > 0 && (
                  <ul className="divide-y divide-corazza-charcoal/5 border-y border-corazza-charcoal/10">
                    {detalle.lineas.map((l, i) => (
                      <li key={i} className="flex justify-between gap-3 py-2">
                        <span>
                          {l.descripcion}
                          {l.cantidad !== null && (
                            <span className="block text-xs text-corazza-taupe">
                              {l.cantidad} {l.unidad ?? ""} {l.precio_unitario !== null ? `× ${dinero(l.precio_unitario)}` : ""}
                            </span>
                          )}
                        </span>
                        <span className="whitespace-nowrap tabular-nums">{dinero(l.total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <dl className="space-y-1.5 tabular-nums">
                  {[
                    ["Subtotal", detalle.subtotal],
                    ["Descuento", detalle.descuento],
                    ["ITBIS", detalle.itbis],
                    ["Total", detalle.total],
                    ["Pagado", detalle.pagado],
                    ["Saldo", detalle.tipo === "factura" ? saldoDe(detalle) : null],
                  ]
                    .filter(([, v]) => v !== null)
                    .map(([t, v]) => (
                      <div key={t as string} className="flex justify-between">
                        <dt className="text-corazza-taupe">{t}</dt>
                        <dd className={t === "Total" ? "font-semibold" : ""}>{dinero(v as number)}</dd>
                      </div>
                    ))}
                </dl>
                {detalle.ncf && <p className="text-xs text-corazza-taupe">NCF: {detalle.ncf}</p>}
                {detalle.cliente.telefono && (
                  <a
                    href={`/panel/whatsapp?tel=${encodeURIComponent(detalle.cliente.telefono)}&nombre=${encodeURIComponent(detalle.cliente.nombre ?? "")}`}
                    className="inline-flex min-h-[40px] items-center rounded-lg border border-corazza-charcoal/15 px-3 text-sm font-semibold hover:bg-corazza-cream/40"
                  >
                    Escribir por WhatsApp
                  </a>
                )}
                {detalle.notas && <p className="text-xs text-corazza-taupe">{detalle.notas}</p>}
                <p className="text-xs text-corazza-taupe">
                  Leído de: {detalle.archivo}
                  {detalle.pdf && (
                    <>
                      {" · "}
                      <button type="button" onClick={() => void verPDF(detalle.pdf!)} className="font-semibold text-corazza-charcoal underline">
                        Ver PDF
                      </button>
                    </>
                  )}
                  {!detalle.pdf && pdfs[detalle.archivo] && (
                    <>
                      {" · "}
                      <a href={pdfs[detalle.archivo]} target="_blank" rel="noreferrer" className="font-semibold text-corazza-charcoal underline">
                        Ver PDF
                      </a>
                    </>
                  )}
                </p>
              </div>
            )}
          </aside>
        </section>

        <div className={`flex flex-wrap items-center gap-3 text-sm ${conectado === false ? "" : "hidden"}`}>
          {!confirmarBorrado ? (
            <button type="button" onClick={() => setConfirmarBorrado(true)} className="text-corazza-taupe underline">
              Borrar todos los datos de este navegador
            </button>
          ) : (
            <>
              <span>¿Borrar todos los documentos leídos?</span>
              <button
                type="button"
                onClick={() => {
                  setDatos(VACIO);
                  setAbierto(null);
                  setConfirmarBorrado(false);
                }}
                className="rounded-lg bg-[#A3463A] px-3 py-1.5 font-semibold text-white"
              >
                Sí, borrar
              </button>
              <button type="button" onClick={() => setConfirmarBorrado(false)} className="underline">
                Cancelar
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
