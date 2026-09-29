"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { COPY } from "../../calculadora/config";
import { formatArea, m2ToFt2 } from "../../calculadora/formulas";
import { NoticeIcon, PlusIcon, WhatsAppIcon } from "../CorazzaIcons";

export type ResultRow = {
  id: string;
  name: string;
  unit: string;
  lines: string[];
  areaM2: number;
  valid: boolean;
  active: boolean;
};

const EASE = [0.16, 1, 0.3, 1] as const;

// Paso 3: el estimado en vivo. Los numeros NO se animan: cambian con cada
// tecla y moverlos en cada cambio seria ruido. Solo entra/sale con suavidad
// cada superficie del resumen.
export default function ResultPanel({
  rows,
  totalM2,
  pieceCount,
  quoteHref,
  canAddSurface,
  onAddSurface,
  onEdit,
  onRemove,
  headingId,
}: {
  rows: ResultRow[];
  totalM2: number;
  pieceCount: number;
  quoteHref: string | null;
  canAddSurface: boolean;
  onAddSurface: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  headingId: string;
}) {
  const reduce = useReducedMotion();
  const validCount = rows.filter((r) => r.valid).length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-corazza-charcoal p-6 text-corazza-white sm:p-8">
      <h3 id={headingId} className="flex items-center gap-3 font-corazza-sans text-sm font-semibold text-corazza-cream">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full border border-corazza-beige/60 font-corazza-serif text-sm lining-nums text-corazza-white"
        >
          3
        </span>
        {COPY.step3}
      </h3>

      <div role="status" aria-live="polite" aria-atomic="true" className="mt-6">
        <p className="font-corazza-sans text-xs font-semibold tracking-[0.12em] text-corazza-beige">{COPY.totalM2}</p>
        <p className="mt-2 flex items-baseline gap-2 font-corazza-serif text-corazza-white">
          <span className="text-[3.25rem] font-medium leading-none lining-nums tabular-nums sm:text-6xl">{formatArea(totalM2)}</span>
          <span className="text-2xl">m²</span>
        </p>
        <p className="mt-2 font-corazza-sans text-base tabular-nums text-corazza-cream">
          {formatArea(m2ToFt2(totalM2))} ft²
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 border-y border-corazza-white/15 py-4">
        <div>
          <dt className="font-corazza-sans text-xs text-corazza-cream">{COPY.pieces}</dt>
          <dd className="mt-1 font-corazza-serif text-2xl lining-nums tabular-nums">{pieceCount}</dd>
        </div>
        <div className="border-l border-corazza-white/15 pl-5">
          <dt className="font-corazza-sans text-xs text-corazza-cream">{COPY.surfaces}</dt>
          <dd className="mt-1 font-corazza-serif text-2xl lining-nums tabular-nums">{validCount}</dd>
        </div>
      </dl>

      <p className="mt-6 flex gap-2.5 font-corazza-sans text-[13px] leading-relaxed text-corazza-white/90">
        <NoticeIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-corazza-beige" />
        {COPY.disclaimer}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {quoteHref ? (
          <a
            href={quoteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-corazza-beige px-6 py-3.5 text-center font-corazza-sans text-sm font-semibold text-corazza-charcoal transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-corazza-cream active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-white"
          >
            <WhatsAppIcon className="h-4 w-4 flex-shrink-0" />
            {COPY.quote}
          </a>
        ) : (
          <>
            <button
              type="button"
              disabled
              aria-describedby="calc-quote-help"
              className="inline-flex min-h-[52px] cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-corazza-white/10 px-6 py-3.5 text-center font-corazza-sans text-sm font-semibold text-corazza-white/70"
            >
              <WhatsAppIcon className="h-4 w-4 flex-shrink-0" />
              {COPY.quote}
            </button>
            <p id="calc-quote-help" className="text-center font-corazza-sans text-xs text-corazza-cream">
              {COPY.quoteDisabled}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onAddSurface}
          disabled={!canAddSurface}
          aria-describedby={canAddSurface ? undefined : "calc-add-help"}
          className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-corazza-white/30 px-6 py-3.5 font-corazza-sans text-sm font-semibold text-corazza-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-corazza-white/60 hover:bg-corazza-white/10 active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-white disabled:cursor-not-allowed disabled:border-corazza-white/15 disabled:text-corazza-white/60 disabled:hover:translate-y-0 disabled:hover:bg-transparent"
        >
          <PlusIcon className="h-4 w-4 flex-shrink-0" />
          {COPY.addSurface}
        </button>
        {!canAddSurface && (
          <p id="calc-add-help" className="text-center font-corazza-sans text-xs text-corazza-cream">
            {COPY.addDisabled}
          </p>
        )}
      </div>
      {rows.length > 0 && (
        <div className="mt-6">
          <p className="font-corazza-sans text-xs font-semibold tracking-[0.12em] text-corazza-beige">{COPY.summary}</p>
          <ol className="mt-3 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {rows.map((row, i) => (
                <motion.li
                  key={row.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.15 } }}
                  transition={reduce ? { duration: 0 } : { duration: 0.28, ease: EASE }}
                  className={`rounded-xl border px-4 py-3 ${
                    row.active ? "border-corazza-beige/60 bg-corazza-white/[0.06]" : "border-corazza-white/15"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 font-corazza-sans text-sm font-semibold">
                      {i + 1}. {row.name} <span className="font-normal text-corazza-cream">({row.unit})</span>
                    </p>
                    <p className="flex-shrink-0 text-right font-corazza-sans text-sm tabular-nums">
                      {row.valid ? `${formatArea(row.areaM2)} m²` : <span className="text-xs text-corazza-beige">{COPY.incomplete}</span>}
                    </p>
                  </div>
                  <ul className="mt-1 font-corazza-sans text-[13px] leading-relaxed text-corazza-cream">
                    {row.lines.map((line) => (
                      <li key={line} className="tabular-nums">
                        {line}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center gap-1">
                    {row.active ? (
                      <span className="font-corazza-sans text-xs font-semibold text-corazza-beige">{COPY.editing}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEdit(row.id)}
                        className="-ml-2 min-h-[44px] rounded-lg px-2 font-corazza-sans text-xs font-semibold text-corazza-white underline decoration-corazza-beige/60 underline-offset-4 transition-colors hover:text-corazza-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-corazza-beige"
                        aria-label={`${COPY.edit} ${row.name} (${i + 1})`}
                      >
                        {COPY.edit}
                      </button>
                    )}
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemove(row.id)}
                        className="ml-auto min-h-[44px] rounded-lg px-2 font-corazza-sans text-xs text-corazza-cream transition-colors hover:text-corazza-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-corazza-beige"
                        aria-label={`${COPY.remove} ${row.name} (${i + 1})`}
                      >
                        {COPY.remove}
                      </button>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </div>
      )}

    </div>
  );
}
