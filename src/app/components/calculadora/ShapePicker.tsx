"use client";

import { SHAPES, type ShapeId } from "../../calculadora/config";
import ShapeDiagram from "./ShapeDiagram";

// Paso 1: tarjetas seleccionables. Son radios nativos (visualmente ocultos)
// dentro de <label>: flechas del teclado, foco y lector de pantalla
// funcionan sin JavaScript extra. El estado visible se deriva de :checked
// y :focus-visible con los variantes has-[] de Tailwind.
export default function ShapePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: ShapeId | null;
  onChange: (shape: ShapeId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {SHAPES.map((shape) => {
        const checked = value === shape.id;
        return (
          <label
            key={shape.id}
            className={`group relative flex cursor-pointer flex-col rounded-2xl border px-3 pb-4 pt-3 transition-[border-color,background-color,transform] duration-200 ease-out active:scale-[0.98] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-corazza-taupe sm:px-4 ${
              checked
                ? "border-corazza-charcoal bg-corazza-cream/35"
                : "border-corazza-charcoal/15 bg-corazza-white hover:border-corazza-charcoal/40 hover:bg-corazza-cream/20"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={shape.id}
              checked={checked}
              onChange={() => onChange(shape.id)}
              className="sr-only"
            />
            {/* Indicador de seleccion (estado real, no decoracion). */}
            <span
              aria-hidden
              className={`absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-200 ${
                checked ? "border-corazza-charcoal bg-corazza-charcoal" : "border-corazza-charcoal/30"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full bg-corazza-white ${checked ? "opacity-100" : "opacity-0"}`} />
            </span>
            <ShapeDiagram shape={shape.id} className="mx-auto h-16 w-auto sm:h-20" />
            <span className="mt-2 font-corazza-sans text-sm font-semibold leading-tight text-corazza-charcoal">
              {shape.name}
            </span>
            <span className="mt-1 font-corazza-sans text-xs leading-snug text-corazza-charcoal/75">{shape.caption}</span>
          </label>
        );
      })}
    </div>
  );
}
