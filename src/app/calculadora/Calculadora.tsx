"use client";

import Image from "next/image";
import { useEffect, useId, useReducer, useRef, useState } from "react";
import { DIMENSION_LABELS, ERRORS, PRICE_ERRORS, PROVINCIAS, SHAPES, TEXT, UNITS } from "./config.ts";
import { MARGIN_MAX, MARGIN_MIN, SHAPE_DIMENSIONS, format2, formatRD, ft2ToM2, parsePositive } from "./formulas.ts";
import FichasClientes, { TIPO_ARRASTRE, datosDeFicha, type Ficha } from "./FichasClientes";
import Reporte, { itemMeasures, shapeLabel } from "./Reporte";
import { initialState, reducer, totals } from "./state.ts";

// Calculadora interna de ventas (especificacion v1.0). Todo el estado vive
// en memoria (useReducer, ver state.ts): no hay login ni servidor. Al
// recargar la pagina se pierde, como permite la especificacion (seccion 9).

const CARD = "rounded-2xl border border-corazza-charcoal/15 bg-corazza-white p-5 sm:p-6";
const H2 = "font-corazza-serif text-2xl font-medium text-corazza-charcoal sm:text-[1.75rem]";
const LABEL = "font-corazza-sans text-sm font-semibold text-corazza-charcoal";
const INPUT =
  "h-12 w-full rounded-xl border bg-corazza-white px-4 font-corazza-sans text-base text-corazza-charcoal placeholder:text-corazza-taupe focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-taupe";
const INPUT_OK = "border-corazza-charcoal/55 hover:border-corazza-charcoal/75";
const INPUT_ERR = "border-corazza-charcoal ring-1 ring-corazza-charcoal";
const BTN_PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-full bg-corazza-charcoal px-6 font-corazza-sans text-sm font-semibold text-corazza-white transition-colors duration-200 hover:bg-corazza-charcoal/90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-taupe disabled:cursor-not-allowed disabled:bg-corazza-charcoal/35";
const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-corazza-charcoal/40 px-5 font-corazza-sans text-sm font-semibold text-corazza-charcoal transition-colors duration-200 hover:border-corazza-charcoal hover:bg-corazza-cream/40 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-taupe disabled:cursor-not-allowed disabled:opacity-50";

// Grupo de opciones (forma / unidad) como radios nativos: flechas del
// teclado y lectores de pantalla funcionan sin codigo extra.
function Segmented<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className={LABEL}>{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = o.id === value;
          return (
            <label
              key={o.id}
              className={`flex min-h-[44px] cursor-pointer items-center rounded-full border px-4 font-corazza-sans text-sm transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-corazza-taupe ${
                checked
                  ? "border-corazza-charcoal bg-corazza-charcoal font-semibold text-corazza-white"
                  : "border-corazza-charcoal/30 text-corazza-charcoal hover:border-corazza-charcoal/60 hover:bg-corazza-cream/30"
              }`}
            >
              <input type="radio" name={name} value={o.id} checked={checked} onChange={() => onChange(o.id)} className="sr-only" />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Calculadora() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [announcement, setAnnouncement] = useState("");
  const uid = useId();
  const descriptionRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const t = totals(state);
  const unitShort = UNITS.find((u) => u.id === state.unit)?.short ?? state.unit;
  const priceParsed = parsePositive(state.priceInput);
  const priceError = state.priceInput.trim() !== "" && !priceParsed.ok ? PRICE_ERRORS[priceParsed.error] : undefined;
  const transportParsed = parsePositive(state.transportInput);
  const transportError = state.transportInput.trim() !== "" && !transportParsed.ok ? PRICE_ERRORS[transportParsed.error] : undefined;
  const reportId = state.report?.date.getTime();

  // Al generar el reporte, llevar la vista (y el foco) hasta el.
  useEffect(() => {
    if (!reportId) return;
    const el = reportRef.current;
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [reportId]);

  function add() {
    const before = state.items.length;
    const next = reducer(state, { type: "add" });
    dispatch({ type: "add" });
    if (next.items.length > before) {
      setAnnouncement(TEXT.added(next.items[next.items.length - 1].description));
      descriptionRef.current?.focus();
    }
  }

  const [soltando, setSoltando] = useState(false);

  function usarFicha(f: Ficha) {
    const datos = datosDeFicha(f);
    const hasData = state.items.length > 0 || state.client.trim() !== "";
    if (hasData && !window.confirm("¿Reemplazar los datos actuales con esta ficha?")) return;
    dispatch({ type: "reset" });
    dispatch({ type: "prefill", ...datos });
    const agregadas = datos.surfaces.filter((s) => s.unit).length;
    setAnnouncement(
      `Ficha de ${datos.client}: ${agregadas} superficie${agregadas === 1 ? "" : "s"} agregada${agregadas === 1 ? "" : "s"}.` +
        (datos.surfaces.length > agregadas ? " Revisa la unidad de las medidas pendientes." : "") +
        (datos.surfaces.length === 0 ? " No se entendieron las medidas: escríbelas abajo." : ""),
    );
  }

  function reset() {
    const hasData = state.items.length > 0 || state.client.trim() !== "" || state.priceInput.trim() !== "";
    if (hasData && !window.confirm(TEXT.confirmReset)) return;
    dispatch({ type: "reset" });
    setAnnouncement("");
  }

  function clearItems() {
    if (state.items.length === 0 || !window.confirm(TEXT.confirmClear)) return;
    dispatch({ type: "clearItems" });
  }

  return (
    <div className="min-h-[100dvh] bg-corazza-white">
      <header className="bg-corazza-charcoal">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <h1 className="flex items-center gap-4">
            <Image src="/corazza-logo-cream.png" alt="Corazza Prime Surfaces" width={720} height={310} priority className="h-auto w-28 sm:w-32" />
            <span className="border-l border-corazza-white/20 pl-4 font-corazza-serif text-2xl font-medium text-corazza-white sm:text-3xl">
              Calculadora
            </span>
          </h1>
          <p className="hidden font-corazza-sans text-xs font-semibold tracking-[0.16em] text-corazza-beige sm:block">{TEXT.internal}</p>
        </div>
      </header>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <main
        className={`mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 ${soltando ? "rounded-3xl outline-dashed outline-2 outline-offset-4 outline-corazza-taupe" : ""}`}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(TIPO_ARRASTRE)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setSoltando(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setSoltando(false);
        }}
        onDrop={(e) => {
          const texto = e.dataTransfer.getData(TIPO_ARRASTRE);
          setSoltando(false);
          if (!texto) return;
          e.preventDefault();
          try {
            usarFicha(JSON.parse(texto) as Ficha);
          } catch {}
        }}
      >
        <div className="mb-6">
          <FichasClientes onUsar={usarFicha} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Cliente */}
            <section aria-labelledby={`${uid}-cliente`} className={CARD}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id={`${uid}-cliente`} className={H2}>
                  {TEXT.clientSection}
                </h2>
                <button type="button" onClick={reset} className={BTN_SECONDARY}>
                  {TEXT.reset}
                </button>
              </div>
              <label htmlFor={`${uid}-client`} className={`${LABEL} mt-4 block`}>
                {TEXT.clientLabel}
              </label>
              <input
                id={`${uid}-client`}
                type="text"
                autoComplete="off"
                value={state.client}
                onChange={(e) => dispatch({ type: "client", value: e.target.value })}
                placeholder={TEXT.clientPlaceholder}
                className={`${INPUT} ${INPUT_OK} mt-2`}
              />
            </section>

            {/* Captura */}
            <section aria-labelledby={`${uid}-captura`} className={CARD}>
              <h2 id={`${uid}-captura`} className={H2}>
                {TEXT.captureSection}
              </h2>
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  add();
                }}
                className="mt-4 flex flex-col gap-5"
              >
                <div>
                  <label htmlFor={`${uid}-desc`} className={LABEL}>
                    {TEXT.descriptionLabel}
                  </label>
                  <input
                    ref={descriptionRef}
                    id={`${uid}-desc`}
                    type="text"
                    autoComplete="off"
                    value={state.description}
                    onChange={(e) => dispatch({ type: "description", value: e.target.value })}
                    placeholder={TEXT.descriptionPlaceholder}
                    className={`${INPUT} ${INPUT_OK} mt-2`}
                  />
                </div>

                <Segmented name={`${uid}-forma`} legend={TEXT.shapeLabel} options={SHAPES} value={state.shape} onChange={(v) => dispatch({ type: "shape", value: v })} />
                <Segmented name={`${uid}-unidad`} legend={TEXT.unitLabel} options={UNITS} value={state.unit} onChange={(v) => dispatch({ type: "unit", value: v })} />

                <div className={`grid gap-4 ${SHAPE_DIMENSIONS[state.shape].length > 1 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
                  {SHAPE_DIMENSIONS[state.shape].map((dim) => {
                    const id = `${uid}-${dim}`;
                    const error = state.dimErrors[dim];
                    return (
                      <div key={dim}>
                        <label htmlFor={id} className={LABEL}>
                          {DIMENSION_LABELS[dim]}
                          <span className="sr-only"> ({UNITS.find((u) => u.id === state.unit)?.label})</span>
                        </label>
                        <div className="relative mt-2">
                          <input
                            id={id}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={state.dimInputs[dim] ?? ""}
                            onChange={(e) => dispatch({ type: "dim", dim, value: e.target.value })}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `${id}-error` : undefined}
                            className={`${INPUT} ${error ? INPUT_ERR : INPUT_OK} pr-12 tabular-nums`}
                          />
                          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-corazza-sans text-sm text-corazza-taupe">
                            {unitShort}
                          </span>
                        </div>
                        {error && (
                          <p id={`${id}-error`} className="mt-1.5 font-corazza-sans text-[13px] text-corazza-charcoal">
                            {ERRORS[error]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button type="submit" className={`${BTN_PRIMARY} self-start`}>
                  {TEXT.add}
                </button>
              </form>
            </section>

            {/* Lista */}
            <section aria-labelledby={`${uid}-lista`} className={CARD}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id={`${uid}-lista`} className={H2}>
                  {TEXT.listSection}{" "}
                  {state.items.length > 0 && (
                    <span className="font-corazza-sans text-sm font-normal text-corazza-taupe">· {TEXT.surfacesCount(state.items.length)}</span>
                  )}
                </h2>
                <button type="button" onClick={clearItems} disabled={state.items.length === 0} className={BTN_SECONDARY}>
                  {TEXT.clearItems}
                </button>
              </div>
              {state.items.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-corazza-charcoal/25 px-4 py-6 text-center font-corazza-sans text-sm text-corazza-charcoal/80">
                  {TEXT.empty}
                </p>
              ) : (
                <ol className="mt-4 divide-y divide-corazza-charcoal/10 border-t border-corazza-charcoal/10">
                  {state.items.map((item, i) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <span className="w-6 flex-shrink-0 font-corazza-sans text-sm tabular-nums text-corazza-taupe">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-corazza-sans text-[15px] font-semibold text-corazza-charcoal">{item.description}</p>
                        <p className="font-corazza-sans text-[13px] text-corazza-charcoal/80">
                          {shapeLabel(item.shape)} · {itemMeasures(item)}
                        </p>
                      </div>
                      <p className="flex-shrink-0 font-corazza-sans text-[15px] font-semibold tabular-nums text-corazza-charcoal">{format2(item.areaFt2)} ft²</p>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "remove", id: item.id })}
                        aria-label={`${TEXT.remove} ${item.description}`}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-corazza-taupe transition-colors hover:bg-corazza-cream/50 hover:text-corazza-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-corazza-taupe"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="h-4 w-4" aria-hidden>
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {/* Resumen */}
          <section aria-labelledby={`${uid}-resumen`} className="lg:col-span-5">
            <div className="rounded-2xl bg-corazza-charcoal p-5 text-corazza-white sm:p-6 lg:sticky lg:top-6">
              <h2 id={`${uid}-resumen`} className="font-corazza-serif text-2xl font-medium sm:text-[1.75rem]">
                {TEXT.summarySection}
              </h2>

              <div aria-live="polite" className="mt-5">
                <p className="font-corazza-sans text-xs font-semibold tracking-[0.12em] text-corazza-beige">{TEXT.totalArea}</p>
                <p className="mt-1 font-corazza-serif text-5xl font-medium leading-none tabular-nums [font-variant-numeric:lining-nums_tabular-nums]">
                  {format2(t.totalFt2)} <span className="text-2xl">ft²</span>
                </p>
                <p className="mt-2 font-corazza-sans text-sm tabular-nums text-corazza-cream">{format2(ft2ToM2(t.totalFt2))} m²</p>
              </div>

              <div className="mt-6 border-t border-corazza-white/15 pt-5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor={`${uid}-margin`} className="font-corazza-sans text-sm font-semibold">
                    {TEXT.margin}
                  </label>
                  <output htmlFor={`${uid}-margin`} className="font-corazza-sans text-base font-semibold tabular-nums">
                    {state.margin}%
                  </output>
                </div>
                <input
                  id={`${uid}-margin`}
                  type="range"
                  min={MARGIN_MIN}
                  max={MARGIN_MAX}
                  step={1}
                  value={state.margin}
                  onChange={(e) => dispatch({ type: "margin", value: Number(e.target.value) })}
                  className="mt-3 h-11 w-full cursor-pointer accent-corazza-beige"
                />
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="font-corazza-sans text-sm">{TEXT.film}</p>
                  <p className="font-corazza-sans text-lg font-semibold tabular-nums">{format2(t.filmFt2)} ft²</p>
                </div>
              </div>

              <div className="mt-5 border-t border-corazza-white/15 pt-5">
                <label htmlFor={`${uid}-price`} className="font-corazza-sans text-sm font-semibold">
                  {TEXT.priceLabel}
                </label>
                <input
                  id={`${uid}-price`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={state.priceInput}
                  onChange={(e) => dispatch({ type: "price", value: e.target.value })}
                  placeholder={TEXT.pricePlaceholder}
                  aria-invalid={priceError ? true : undefined}
                  aria-describedby={priceError ? `${uid}-price-error` : undefined}
                  className="mt-2 h-12 w-full rounded-xl border border-corazza-white/40 bg-corazza-white/10 px-4 font-corazza-sans text-base tabular-nums text-corazza-white placeholder:text-corazza-cream/80 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-beige"
                />
                {priceError && (
                  <p id={`${uid}-price-error`} className="mt-1.5 font-corazza-sans text-[13px] text-corazza-cream">
                    {priceError}
                  </p>
                )}
                {t.quote !== null && (
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <p className="font-corazza-sans text-sm">{TEXT.quote}</p>
                    <p className="font-corazza-serif text-3xl font-medium tabular-nums [font-variant-numeric:lining-nums_tabular-nums]">{formatRD(t.quote)}</p>
                  </div>
                )}
              </div>

              {/* Transporte (opcional): se suma a la cotizacion. */}
              <div className="mt-5 border-t border-corazza-white/15 pt-5">
                {!state.transportOn ? (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "transportOn", value: true })}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-corazza-white/40 px-5 font-corazza-sans text-sm font-semibold text-corazza-white hover:bg-corazza-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-beige"
                  >
                    + {TEXT.transportAdd}
                  </button>
                ) : (
                  <fieldset>
                    <div className="flex items-baseline justify-between gap-3">
                      <legend className="font-corazza-sans text-sm font-semibold">{TEXT.transportSection}</legend>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "transportOn", value: false })}
                        className="font-corazza-sans text-xs text-corazza-cream underline underline-offset-2 hover:text-corazza-white"
                      >
                        {TEXT.transportRemove}
                      </button>
                    </div>
                    <label htmlFor={`${uid}-province`} className="mt-3 block font-corazza-sans text-[13px] text-corazza-cream">
                      {TEXT.transportProvince}
                    </label>
                    <select
                      id={`${uid}-province`}
                      value={state.province}
                      onChange={(e) => dispatch({ type: "province", value: e.target.value })}
                      className="mt-1 h-12 w-full rounded-xl border border-corazza-white/40 bg-corazza-white/10 px-4 font-corazza-sans text-base text-corazza-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-beige [&>option]:text-corazza-charcoal"
                    >
                      <option value="">{TEXT.transportProvincePlaceholder}</option>
                      {PROVINCIAS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <label htmlFor={`${uid}-transport`} className="mt-3 block font-corazza-sans text-[13px] text-corazza-cream">
                      {TEXT.transportAmount}
                    </label>
                    <input
                      id={`${uid}-transport`}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={state.transportInput}
                      onChange={(e) => dispatch({ type: "transport", value: e.target.value })}
                      aria-invalid={transportError ? true : undefined}
                      aria-describedby={transportError ? `${uid}-transport-error` : undefined}
                      className="mt-1 h-12 w-full tabular-nums placeholder:text-corazza-cream/80 rounded-xl border border-corazza-white/40 bg-corazza-white/10 px-4 font-corazza-sans text-base text-corazza-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-beige"
                    />
                    {transportError && (
                      <p id={`${uid}-transport-error`} className="mt-1.5 font-corazza-sans text-[13px] text-corazza-cream">
                        {transportError}
                      </p>
                    )}
                  </fieldset>
                )}
                {t.total !== null && t.transport && (
                  <div className="mt-4 flex items-baseline justify-between gap-3">
                    <p className="font-corazza-sans text-sm font-semibold">{TEXT.total}</p>
                    <p className="font-corazza-serif text-3xl font-medium tabular-nums [font-variant-numeric:lining-nums_tabular-nums]">{formatRD(t.total)}</p>
                  </div>
                )}
              </div>

              <ul className="mt-5 flex flex-col gap-2 font-corazza-sans text-xs leading-relaxed text-corazza-cream">
                <li>{TEXT.filmNote}</li>
                {t.quote !== null && <li>{TEXT.quoteNote}</li>}
              </ul>

              <button
                type="button"
                onClick={() => dispatch({ type: "generate", date: new Date() })}
                disabled={state.items.length === 0}
                aria-describedby={state.items.length === 0 ? `${uid}-gen-help` : undefined}
                className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-corazza-beige px-6 font-corazza-sans text-sm font-semibold text-corazza-charcoal transition-colors duration-200 hover:bg-corazza-cream active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-white disabled:cursor-not-allowed disabled:bg-corazza-white/10 disabled:text-corazza-white/60"
              >
                {TEXT.generate}
              </button>
              {state.items.length === 0 && (
                <p id={`${uid}-gen-help`} className="mt-2 text-center font-corazza-sans text-xs text-corazza-cream">
                  {TEXT.generateDisabled}
                </p>
              )}
              {state.reportStale && !state.report && (
                <p role="status" className="mt-3 text-center font-corazza-sans text-xs text-corazza-cream">
                  {TEXT.reportStale}
                </p>
              )}
            </div>
          </section>
        </div>

        {state.report && (
          <div ref={reportRef} tabIndex={-1} className="mt-10 scroll-mt-6 focus:outline-none">
            <Reporte report={state.report} />
          </div>
        )}
      </main>
    </div>
  );
}

