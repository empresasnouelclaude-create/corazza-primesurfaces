import Image from "next/image";
import { WHATSAPP_LINKS } from "../config";
import { WhatsAppIcon, CompassIcon } from "./CorazzaIcons";
import Reveal from "./Reveal";
import WaveDivider from "./WaveDivider";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-corazza-charcoal">
      {/* Ola de fondo, muy discreta, apenas visible en la esquina inferior --
          el detalle de marca del hero, sin competir con el contenido. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.15]">
        <WaveDivider toneClassName="text-corazza-beige" className="h-24" />
      </div>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-24">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Reveal>
            <Image
              src="/corazza-logo-cream.png"
              alt="Corazza Prime Surfaces"
              width={720}
              height={310}
              priority
              className="h-auto w-56 sm:w-64 lg:w-72"
            />
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-5 font-corazza-sans text-[11px] font-semibold uppercase tracking-[0.32em] text-corazza-beige">
              Protect · Preserve · Elevate
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <h1 className="mt-5 max-w-md font-corazza-serif text-3xl font-medium leading-[1.15] text-corazza-white sm:text-4xl lg:text-[2.75rem]">
              Protección premium para las superficies que forman parte de tus espacios.
            </h1>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a
                href={WHATSAPP_LINKS.cotizar}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-corazza-beige px-7 py-3.5 font-corazza-sans text-sm font-semibold text-corazza-charcoal transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-corazza-cream active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-white"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Cotiza tu superficie
              </a>
              {/* "Como funciona" esta archivada hasta tener contenido
                  redactado (ver page.tsx) -- se deja el boton en su lugar,
                  con el mismo aspecto, pero como <span> (no <a>): no hay
                  seccion a la que llevar todavia. */}
              <span
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-corazza-white/25 px-7 py-3.5 font-corazza-sans text-sm font-semibold text-corazza-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-corazza-white/10 active:scale-[0.97] cursor-default"
                aria-disabled="true"
              >
                <CompassIcon className="h-4 w-4" />
                Conoce cómo funciona
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="hidden lg:block">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
            <Image
              src="/hero-producto.jpg"
              alt="Kit de cuidado Corazza Prime Surfaces: ambientador y paños de microfibra"
              fill
              sizes="480px"
              className="object-cover object-center"
              priority
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
