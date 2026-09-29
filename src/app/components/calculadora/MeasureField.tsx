"use client";

import { NoticeIcon } from "../CorazzaIcons";

// Campo de medida: etiqueta arriba, unidad dentro del campo a la derecha y
// error debajo (enlazado con aria-describedby). Es texto con inputMode
// decimal -- no type="number" -- para aceptar coma decimal ("120,5") y no
// cambiar el valor con la rueda del mouse.
export default function MeasureField({
  id,
  label,
  value,
  unit,
  unitSpoken,
  error,
  onChange,
  onFocus,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  unit: string;
  /** Unidad completa para lectores de pantalla ("centímetros"). */
  unitSpoken: string;
  error?: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-corazza-sans text-xs font-semibold tracking-[0.08em] text-corazza-charcoal">
        {label}
        <span className="sr-only"> en {unitSpoken}</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-12 w-full rounded-xl border bg-corazza-white pl-4 pr-14 font-corazza-sans text-base tabular-nums text-corazza-charcoal transition-colors duration-150 placeholder:text-corazza-taupe focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-taupe ${
            error ? "border-corazza-charcoal ring-1 ring-corazza-charcoal" : "border-corazza-charcoal/55 hover:border-corazza-charcoal/75"
          }`}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-corazza-sans text-sm text-corazza-taupe"
        >
          {unit}
        </span>
      </div>
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 font-corazza-sans text-[13px] leading-snug text-corazza-charcoal">
          <NoticeIcon className="mt-px h-4 w-4 flex-shrink-0 text-corazza-taupe" />
          {error}
        </p>
      )}
    </div>
  );
}
