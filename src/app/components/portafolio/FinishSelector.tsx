"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import type { Finish } from "../../portafolio";

const EASE = [0.16, 1, 0.3, 1] as const;

// Muestra de material: brillo (reflejo especular) frente a mate (plano).
// Es solo una referencia visual del acabado, hecha con los colores de la
// paleta -- no representa una fotografia del producto.
function FinishSwatch({ id }: { id: Finish["id"] }) {
  if (id === "high-gloss") {
    return (
      <span
        aria-hidden
        className="relative block h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_32%_28%,#F9F5ED_0%,#DACFB6_38%,#B89C82_100%)] ring-1 ring-corazza-white/30"
      >
        <span className="absolute left-[18%] top-[14%] h-[26%] w-[42%] -rotate-[24deg] rounded-full bg-corazza-white/80 blur-[2px]" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="block h-11 w-11 flex-shrink-0 rounded-full bg-corazza-cream shadow-[inset_0_0_0_1px_rgba(58,43,32,0.08)] ring-1 ring-corazza-white/30"
    />
  );
}

// Selector de los dos acabados de la pagina 9 del PDF. Patron de pestañas
// accesible (WAI-ARIA tabs): flechas / Inicio / Fin para moverse, foco
// visible, y un solo panel que muestra la ficha del acabado elegido. Al
// cambiar, solo los valores que realmente difieren entre acabados hacen
// un fundido -- el movimiento señala que cambio, sin redibujar todo.
export default function FinishSelector({ finishes }: { finishes: readonly Finish[] }) {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const finish = finishes[active];

  function select(index: number) {
    const next = (index + finishes.length) % finishes.length;
    setActive(next);
    tabsRef.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys: Record<string, () => void> = {
      ArrowRight: () => select(active + 1),
      ArrowDown: () => select(active + 1),
      ArrowLeft: () => select(active - 1),
      ArrowUp: () => select(active - 1),
      Home: () => select(0),
      End: () => select(finishes.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }

  const valueMotion = reduce
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 4, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, filter: "blur(2px)", transition: { duration: 0.12 } },
        transition: { duration: 0.32, ease: EASE },
      };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
      <div
        role="tablist"
        aria-label="Acabados Corazza"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-corazza-white/15 p-1.5 lg:col-span-4 lg:grid-cols-1 lg:self-start lg:border-0 lg:p-0"
      >
        {finishes.map((item, i) => {
          const selected = i === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`acabado-tab-${item.id}`}
              aria-selected={selected}
              aria-controls="acabado-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onKeyDown}
              className={`relative flex min-h-[56px] items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-beige sm:gap-4 sm:px-4 lg:min-h-[88px] lg:rounded-2xl lg:border lg:px-5 ${
                selected
                  ? "text-corazza-white lg:border-corazza-beige/60"
                  : "text-corazza-white/70 hover:text-corazza-white lg:border-corazza-white/15 lg:hover:border-corazza-white/30"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="acabado-indicador"
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-corazza-white/10 lg:rounded-2xl"
                  transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0 }}
                />
              )}
              <span className="relative flex items-center gap-3 sm:gap-4">
                <FinishSwatch id={item.id} />
                <span className="flex flex-col">
                  <span className="font-corazza-serif text-lg font-semibold leading-tight tracking-wide sm:text-xl lg:text-2xl">
                    {item.name}
                  </span>
                  <span className="mt-1 hidden font-corazza-sans text-[10px] font-medium tracking-[0.18em] text-corazza-cream lg:block">
                    {item.subtitle}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="acabado-panel"
        aria-labelledby={`acabado-tab-${finish.id}`}
        tabIndex={0}
        className="grid overflow-hidden rounded-2xl bg-corazza-white text-corazza-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-corazza-beige sm:grid-cols-5 lg:col-span-8"
      >
        {/* Foto del acabado elegido: cambia con un fundido al cambiar de
            pestaña. Las dos se precargan para que el cambio sea inmediato. */}
        <div className="relative aspect-[4/3] bg-corazza-cream sm:col-span-2 sm:aspect-auto sm:min-h-full">
          {finishes.map((item, i) => (
            <motion.div
              key={item.id}
              aria-hidden={i !== active}
              initial={false}
              animate={{ opacity: i === active ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.4, ease: EASE }}
              className="absolute inset-0"
            >
              <Image
                src={item.image.src}
                width={item.image.width}
                height={item.image.height}
                alt={i === active ? item.image.alt : ""}
                sizes="(min-width: 1152px) 300px, (min-width: 640px) 40vw, 100vw"
                className="h-full w-full object-cover"
              />
            </motion.div>
          ))}
        </div>

        <div className="p-6 sm:col-span-3 sm:p-8 lg:p-10">
          <p className="font-corazza-sans text-[11px] font-semibold tracking-[0.24em] text-corazza-taupe">
            {finish.brand}
          </p>
          <div className="mt-2 min-h-[2.75rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h3
                key={finish.name}
                {...valueMotion}
                className="font-corazza-serif text-4xl font-semibold leading-none tracking-wide sm:text-[2.75rem]"
              >
                {finish.name}
              </motion.h3>
            </AnimatePresence>
          </div>
          <p className="mt-3 font-corazza-sans text-[11px] font-medium tracking-[0.18em] text-corazza-taupe">
            {finish.subtitle}
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-corazza-charcoal/10 pt-8 sm:grid-cols-2">
            {finish.specs.map((spec) => (
              <div key={spec.label}>
                <dt className="font-corazza-sans text-[11px] font-semibold tracking-[0.16em] text-corazza-taupe">
                  {spec.label}
                </dt>
                <dd className="mt-1.5 font-corazza-sans text-base leading-snug text-corazza-charcoal">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={spec.value} {...valueMotion} className="block">
                      {spec.value}
                    </motion.span>
                  </AnimatePresence>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
