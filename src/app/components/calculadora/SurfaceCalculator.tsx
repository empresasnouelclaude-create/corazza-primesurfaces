"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useRef, useState } from "react";
import {
  COPY,
  CUSTOM_PIECE_LIMIT,
  DIMENSION_LABELS,
  ERROR_MESSAGES,
  UNITS,
  WHATSAPP_TEXT,
  type ShapeId,
} from "../../calculadora/config";
import { buildQuoteMessage, convertInput, type Dimension, type Unit } from "../../calculadora/formulas";
import { whatsappLinkWithMessage } from "../../config";
import { CloseIcon, PlusIcon, WhatsAppIcon } from "../CorazzaIcons";
import MeasureField from "./MeasureField";
import ResultPanel, { type ResultRow } from "./ResultPanel";
import ShapeDiagram from "./ShapeDiagram";
import ShapePicker from "./ShapePicker";
import {
  evaluate,
  newSurface,
  pieceSpecs,
  shapeConfig,
  summaryLines,
  unitLabel,
  unitShort,
  type Surface,
} from "./state";

const EASE = [0.16, 1, 0.3, 1] as const;

function StepHeading({ n, children, id }: { n: number; children: string; id?: string }) {
  return (
    <h3 id={id} tabIndex={id ? -1 : undefined} className="flex scroll-mt-6 items-center gap-3 font-corazza-sans text-sm font-semibold text-corazza-charcoal focus:outline-none">
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-full border border-corazza-charcoal/30 font-corazza-serif text-sm lining-nums text-corazza-charcoal"
      >
        {n}
      </span>
      {children}
    </h3>
  );
}

export default function SurfaceCalculator() {
  const uid = useId();
  const reduce = useReducedMotion();
  const counter = useRef(1);
  const [surfaces, setSurfaces] = useState<Surface[]>(() => [newSurface("superficie-1")]);
  const [activeId, setActiveId] = useState("superficie-1");
  const [activePiece, setActivePiece] = useState<number | null>(null);

  const active = surfaces.find((s) => s.id === activeId) ?? surfaces[0];
  const config = shapeConfig(active.shape);
  const specs = pieceSpecs(active);
  const activeEval = evaluate(active);

  const evaluations = useMemo(() => surfaces.map((s) => ({ surface: s, result: evaluate(s) })), [surfaces]);
  const withShape = evaluations.filter((e) => e.surface.shape);
  const valid = withShape.filter((e) => e.result.valid);
  const totalM2 = valid.reduce((sum, e) => sum + e.result.areaM2, 0);
  const pieceCount = valid.reduce((sum, e) => sum + e.result.pieceCount, 0);

  const rows: ResultRow[] = withShape.map(({ surface, result }) => ({
    id: surface.id,
    name: shapeConfig(surface.shape)?.name ?? "",
    unit: unitShort(surface.unit),
    lines: summaryLines(surface),
    areaM2: result.areaM2,
    valid: result.valid,
    active: surface.id === active.id,
  }));

  const quoteHref =
    valid.length > 0
      ? whatsappLinkWithMessage(
          buildQuoteMessage(
            valid.map(({ surface, result }) => ({
              name: shapeConfig(surface.shape)?.name ?? "",
              unitLabel: unitLabel(surface.unit),
              lines: summaryLines(surface),
              areaM2: result.areaM2,
            })),
            WHATSAPP_TEXT,
            pieceCount,
          ),
        )
      : null;

  // --- Actualizaciones de la superficie activa -------------------------------
  function update(patch: (s: Surface) => Surface) {
    setSurfaces((list) => list.map((s) => (s.id === active.id ? patch(s) : s)));
  }

  function selectShape(shape: ShapeId) {
    if (shape === active.shape) return;
    const next = shapeConfig(shape);
    update((s) => ({
      ...s,
      shape,
      pieces: (next?.pieces ?? []).map(() => ({})),
      touched: {},
      showAllErrors: false,
    }));
    setActivePiece(null);
  }

  function setValue(i: number, dim: Dimension, value: string) {
    update((s) => ({ ...s, pieces: s.pieces.map((p, j) => (j === i ? { ...p, [dim]: value } : p)) }));
  }

  function touch(i: number, dim: Dimension) {
    update((s) => ({ ...s, touched: { ...s.touched, [`${i}-${dim}`]: true } }));
  }

  function setUnit(unit: Unit) {
    update((s) => {
      if (unit === s.unit) return s;
      // Ida y vuelta sin perdida: si la persona vuelve a la unidad anterior
      // sin haber editado nada, se restauran sus valores originales (la
      // conversion redondea a 2 decimales: 60 cm -> 23.62 in -> 59.99 cm).
      if (s.unitMemo && s.unitMemo.unit === unit && JSON.stringify(s.unitMemo.converted) === JSON.stringify(s.pieces)) {
        return { ...s, unit, pieces: s.unitMemo.pieces, unitMemo: undefined };
      }
      const converted = s.pieces.map((p) => {
        const next: typeof p = {};
        for (const [dim, raw] of Object.entries(p) as [Dimension, string | undefined][]) {
          next[dim] = convertInput(raw, s.unit, unit);
        }
        return next;
      });
      return { ...s, unit, pieces: converted, unitMemo: { unit: s.unit, pieces: s.pieces, converted } };
    });
  }

  function addPiece() {
    update((s) => ({ ...s, pieces: [...s.pieces, {}] }));
  }

  function removePiece(i: number) {
    update((s) => {
      // Reindexa "touched" para que los errores sigan a su pieza.
      const touched: Record<string, true> = {};
      for (const key of Object.keys(s.touched)) {
        const [idx, dim] = key.split("-");
        const n = Number(idx);
        if (n < i) touched[key] = true;
        else if (n > i) touched[`${n - 1}-${dim}`] = true;
      }
      return { ...s, pieces: s.pieces.filter((_, j) => j !== i), touched };
    });
  }

  // --- Varias superficies -------------------------------------------------
  function focusStep1() {
    requestAnimationFrame(() => {
      const heading = document.getElementById(`${uid}-paso1`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  }

  function addSurface() {
    if (!activeEval.valid) {
      update((s) => ({ ...s, showAllErrors: true }));
      return;
    }
    counter.current += 1;
    const next = newSurface(`superficie-${counter.current}`, active.unit);
    setSurfaces((list) => [...list, next]);
    setActiveId(next.id);
    setActivePiece(null);
    focusStep1();
  }

  function editSurface(id: string) {
    // Si la superficie que se deja atras quedo sin forma, se descarta.
    setSurfaces((list) => list.filter((s) => s.id === id || s.shape !== null));
    setActiveId(id);
    setActivePiece(null);
    focusStep1();
  }

  function removeSurface(id: string) {
    const rest = surfaces.filter((s) => s.id !== id);
    if (rest.length === 0) {
      counter.current += 1;
      const fresh = newSurface(`superficie-${counter.current}`, active.unit);
      setSurfaces([fresh]);
      setActiveId(fresh.id);
      return;
    }
    setSurfaces(rest);
    if (id === active.id) setActiveId(rest[rest.length - 1].id);
  }

  const errorFor = (i: number, dim: Dimension) => {
    const error = activeEval.errors[i]?.[dim];
    if (!error) return undefined;
    // Solo en campos ya visitados (al salir de ellos): no se regaña un
    // campo que la persona todavia no toco.
    const shown = active.showAllErrors || active.touched[`${i}-${dim}`];
    return shown ? ERROR_MESSAGES[error] : undefined;
  };

  const enter = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
    : {
        initial: { opacity: 0, y: 8, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.26, ease: EASE } },
        exit: { opacity: 0, y: -4, filter: "blur(2px)", transition: { duration: 0.12 } },
      };

  const multiPiece = specs.length > 1 || active.shape === "personalizada";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="rounded-2xl border border-corazza-charcoal/15 bg-corazza-white p-5 sm:p-8 lg:col-span-7">
        {/* Paso 1 */}
        <fieldset>
          <legend className="sr-only">{COPY.step1}</legend>
          <StepHeading n={1} id={`${uid}-paso1`}>
            {COPY.step1}
          </StepHeading>
          <div className="mt-5">
            <ShapePicker name={`${uid}-forma-${active.id}`} value={active.shape} onChange={selectShape} />
          </div>
        </fieldset>

        {/* Paso 2 */}
        <div className="mt-10 border-t border-corazza-charcoal/10 pt-8">
          <StepHeading n={2}>{COPY.step2}</StepHeading>

          <AnimatePresence mode="wait" initial={false}>
            {!config ? (
              <motion.p
                key="vacio"
                {...enter}
                className="mt-5 rounded-xl border border-dashed border-corazza-charcoal/25 px-5 py-8 text-center font-corazza-sans text-sm text-corazza-charcoal/80"
              >
                {COPY.noShape}
              </motion.p>
            ) : (
              <motion.div key={`${active.id}-${config.id}`} {...enter} className="mt-5">
                {/* Unidad */}
                <fieldset className="flex flex-wrap items-center gap-3">
                  <legend className="sr-only">{COPY.unitLegend}</legend>
                  <span aria-hidden className="font-corazza-sans text-xs font-semibold tracking-[0.08em] text-corazza-charcoal">
                    {COPY.unitLegend}
                  </span>
                  <div className="inline-flex rounded-full border border-corazza-charcoal/25 p-1">
                    {UNITS.map((u) => (
                      <label
                        key={u.id}
                        className={`relative flex min-h-[40px] cursor-pointer items-center rounded-full px-4 font-corazza-sans text-sm transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-corazza-taupe ${
                          active.unit === u.id
                            ? "bg-corazza-charcoal font-semibold text-corazza-white"
                            : "text-corazza-charcoal hover:bg-corazza-cream/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`${uid}-unidad-${active.id}`}
                          value={u.id}
                          checked={active.unit === u.id}
                          onChange={() => setUnit(u.id)}
                          className="sr-only"
                        />
                        {u.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Diagrama con cotas + ayuda */}
                <div className="mt-6 grid grid-cols-1 items-center gap-4 rounded-xl bg-corazza-cream/30 p-4 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-6 sm:p-5">
                  <ShapeDiagram shape={config.id} detailed activePiece={activePiece} className="mx-auto h-auto w-full max-w-[15rem]" />
                  <p className="font-corazza-sans text-sm leading-relaxed text-corazza-charcoal">{config.help}</p>
                </div>

                {/* Campos */}
                <div className="mt-6 flex flex-col gap-5">
                  <AnimatePresence initial={false}>
                    {specs.map((spec, i) => {
                      const fields = (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          {spec.dims.map((dim) => (
                            <MeasureField
                              key={dim}
                              id={`${uid}-${active.id}-${i}-${dim}`}
                              label={multiPiece ? `${DIMENSION_LABELS[dim]} ${i + 1}` : DIMENSION_LABELS[dim]}
                              value={active.pieces[i]?.[dim] ?? ""}
                              unit={unitShort(active.unit)}
                              unitSpoken={unitLabel(active.unit)}
                              error={errorFor(i, dim)}
                              onChange={(v) => setValue(i, dim, v)}
                              onFocus={() => setActivePiece(i)}
                              onBlur={() => {
                                setActivePiece(null);
                                touch(i, dim);
                              }}
                            />
                          ))}
                        </div>
                      );
                      if (!multiPiece) return <div key={i}>{fields}</div>;
                      return (
                        <motion.fieldset
                          key={`${active.id}-${i}`}
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.12 } }}
                          transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE }}
                          className={`rounded-xl border p-4 transition-colors duration-200 ${
                            activePiece === i ? "border-corazza-charcoal/40 bg-corazza-cream/20" : "border-corazza-charcoal/10"
                          }`}
                        >
                          <legend className="-ml-1 flex items-center gap-2 px-1 font-corazza-sans text-sm font-semibold text-corazza-charcoal">
                            <span
                              aria-hidden
                              className={`flex h-6 w-6 items-center justify-center rounded-full font-corazza-sans text-xs font-semibold text-corazza-white transition-colors duration-200 ${
                                activePiece === i ? "bg-corazza-charcoal" : "bg-corazza-taupe"
                              }`}
                            >
                              {i + 1}
                            </span>
                            {spec.label}
                          </legend>
                          {active.shape === "personalizada" && specs.length > 1 && (
                            <div className="-mt-2 mb-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removePiece(i)}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 font-corazza-sans text-xs text-corazza-charcoal/80 transition-colors hover:text-corazza-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-corazza-taupe"
                                aria-label={`${COPY.removePiece} ${i + 1}`}
                              >
                                <CloseIcon className="h-3.5 w-3.5" />
                                {COPY.removePiece}
                              </button>
                            </div>
                          )}
                          {fields}
                        </motion.fieldset>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {active.shape === "personalizada" && (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={addPiece}
                      disabled={active.pieces.length >= CUSTOM_PIECE_LIMIT}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-corazza-charcoal/40 px-5 font-corazza-sans text-sm font-semibold text-corazza-charcoal transition-all duration-200 hover:-translate-y-0.5 hover:border-corazza-charcoal hover:bg-corazza-cream/30 active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-taupe disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {COPY.addPiece}
                    </button>
                    <a
                      href={whatsappLinkWithMessage(WHATSAPP_TEXT.visit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-4 font-corazza-sans text-sm font-semibold text-corazza-charcoal underline decoration-corazza-beige underline-offset-4 transition-colors hover:decoration-corazza-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-taupe"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      {COPY.requestVisit}
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Paso 3 */}
      <div className="lg:sticky lg:top-6 lg:col-span-5 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto lg:rounded-2xl lg:[scrollbar-color:#7E6A52_transparent] lg:[scrollbar-width:thin]">
        <ResultPanel
          headingId={`${uid}-paso3`}
          rows={rows}
          totalM2={totalM2}
          pieceCount={pieceCount}
          quoteHref={quoteHref}
          canAddSurface={activeEval.valid}
          onAddSurface={addSurface}
          onEdit={editSurface}
          onRemove={removeSurface}
        />
      </div>
    </div>
  );
}
