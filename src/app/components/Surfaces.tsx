import { SURFACES } from "../config";
import Reveal from "./Reveal";

// Franja horizontal con desplazamiento (scroll-snap), no una grilla de 6
// tarjetas iguales: distinto de "Como funciona" (lista dividida) y del
// hero (split), y mucho mejor comportamiento en movil que una grilla
// apretada de 6 columnas.
export default function Surfaces() {
  return (
    <section id="superficies" className="bg-corazza-white">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-24">
        <Reveal className="max-w-lg">
          <h2 className="font-corazza-serif text-3xl font-medium text-corazza-charcoal sm:text-4xl">
            Superficies que protegemos
          </h2>
          <p className="mt-3 font-corazza-sans text-sm leading-relaxed text-corazza-charcoal/70">
            Cada material tiene su propio cuidado. Cuéntanos el tuyo y te decimos cómo podemos ayudarte.
          </p>
        </Reveal>

        <div className="mt-10 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden">
          {SURFACES.map((surface, i) => (
            <Reveal
              key={surface.name}
              delay={i * 0.05}
              y={14}
              className="w-64 flex-shrink-0 snap-start sm:w-72"
            >
              <div className="flex h-full flex-col justify-between rounded-2xl border border-corazza-charcoal/10 bg-corazza-cream/30 p-6">
                <p className="font-corazza-serif text-xl font-medium text-corazza-charcoal">
                  {surface.name}
                </p>
                <p className="mt-3 font-corazza-sans text-sm leading-relaxed text-corazza-charcoal/70">
                  {surface.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
