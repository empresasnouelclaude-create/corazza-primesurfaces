import { COPY } from "../../calculadora/config";
import Reveal from "../Reveal";
import WaveDivider from "../WaveDivider";
import SurfaceCalculator from "./SurfaceCalculator";

// Seccion "Calcula tu superficie" (#calcula). El encabezado es estatico
// (servidor); la herramienta es una isla cliente.
export default function CalculatorSection() {
  return (
    <section id="calcula" aria-labelledby="calcula-titulo" className="relative scroll-mt-4 overflow-hidden bg-corazza-white">
      {/* Onda de marca, muy tenue, como textura detras del encabezado. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 opacity-60">
        <WaveDivider toneClassName="text-corazza-beige/35" className="h-16" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <Reveal>
            <h2
              id="calcula-titulo"
              className="font-corazza-serif text-4xl font-medium leading-[1.05] tracking-[-0.01em] text-corazza-charcoal text-balance sm:text-5xl lg:text-[3.5rem]"
            >
              {COPY.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 max-w-xl font-corazza-sans text-base leading-relaxed text-corazza-charcoal/85 sm:text-lg">
              {COPY.intro}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mt-12">
          <SurfaceCalculator />
        </Reveal>
      </div>
    </section>
  );
}
