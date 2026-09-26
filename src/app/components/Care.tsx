import { WHATSAPP_LINKS } from "../config";
import { ShieldIcon, WhatsAppIcon } from "./CorazzaIcons";
import Reveal from "./Reveal";
import WaveDivider from "./WaveDivider";

export default function Care() {
  return (
    <section id="cuidados" className="relative overflow-hidden bg-corazza-charcoal">
      <div className="pointer-events-none absolute inset-x-0 top-0 rotate-180 opacity-[0.12]">
        <WaveDivider toneClassName="text-corazza-beige" className="h-20" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-20 text-center sm:px-8 sm:py-24">
        <Reveal className="flex flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-corazza-beige/15">
            <ShieldIcon className="h-5 w-5 text-corazza-beige" />
          </span>
          <h2 className="mt-6 font-corazza-serif text-3xl font-medium text-corazza-white sm:text-4xl">
            Cuidados y garantía
          </h2>
          <p className="mt-4 max-w-xl font-corazza-sans text-sm leading-relaxed text-corazza-white/70 sm:text-base">
            Cada superficie y cada proyecto requiere recomendaciones específicas. Escríbenos y te
            orientamos sobre el cuidado adecuado y las condiciones de garantía de tu servicio.
          </p>
          <a
            href={WHATSAPP_LINKS.cuidados}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-2.5 rounded-full bg-corazza-beige px-7 py-3.5 font-corazza-sans text-sm font-semibold text-corazza-charcoal transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-corazza-cream active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-white"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Recibe orientación
          </a>
        </Reveal>
      </div>
    </section>
  );
}
