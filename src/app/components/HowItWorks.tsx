import { HOW_IT_WORKS_STEPS } from "../config";
import Reveal from "./Reveal";

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-corazza-cream/40">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:px-8 sm:py-24">
        <Reveal className="max-w-lg">
          <h2 className="font-corazza-serif text-3xl font-medium text-corazza-charcoal sm:text-4xl">
            Cómo funciona
          </h2>
        </Reveal>

        {/* Numeros grandes en vez de tarjetas iguales: cada paso ocupa su
            propia fila, separado por una linea fina en vez de un contenedor
            con sombra -- coherente con "evitar tarjetas repetitivas". */}
        <div className="mt-12 divide-y divide-corazza-charcoal/10 border-t border-corazza-charcoal/10">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08} y={16}>
              <div className="flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:gap-8 sm:py-8">
                <span className="font-corazza-serif text-4xl font-medium text-corazza-beige sm:w-20 sm:flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-corazza-sans text-base font-semibold text-corazza-charcoal">
                    {step.title}
                  </p>
                  <p className="mt-1.5 max-w-md font-corazza-sans text-sm leading-relaxed text-corazza-charcoal/70">
                    {step.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
