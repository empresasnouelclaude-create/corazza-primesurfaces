import { GALLERY_PLACEHOLDERS } from "../config";
import PlaceholderPhoto from "./PlaceholderPhoto";
import Reveal from "./Reveal";

export default function Gallery() {
  return (
    <section id="galeria" className="bg-corazza-cream/40">
      <div className="mx-auto max-w-5xl px-6 py-20 sm:px-8 sm:py-24">
        <Reveal className="max-w-lg">
          <h2 className="font-corazza-serif text-3xl font-medium text-corazza-charcoal sm:text-4xl">
            Antes y después
          </h2>
          <p className="mt-3 font-corazza-sans text-sm leading-relaxed text-corazza-charcoal/70">
            Resultados reales de proyectos protegidos por Corazza.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {GALLERY_PLACEHOLDERS.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.06} y={16}>
              <div className="grid grid-cols-2 gap-2">
                <PlaceholderPhoto
                  label={`${item.label} · Antes`}
                  suggestedFile={`public/galeria/${item.id}-antes.jpg`}
                  aspectClassName="aspect-square"
                />
                <PlaceholderPhoto
                  label={`${item.label} · Después`}
                  suggestedFile={`public/galeria/${item.id}-despues.jpg`}
                  aspectClassName="aspect-square"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
