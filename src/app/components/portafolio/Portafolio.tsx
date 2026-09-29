import Image from "next/image";
import {
  APLICACIONES,
  BENEFICIOS,
  EXPERIENCIA,
  MANIFIESTO,
  PORTADA,
  PORTFOLIO_IMAGES,
  SERVICIO,
  SOLUCION,
  SUPERFICIES,
  TECNOLOGIA,
  type PortfolioImage,
} from "../../portafolio";
import { NoticeIcon } from "../CorazzaIcons";
import Reveal from "../Reveal";
import WaveDivider from "../WaveDivider";
import FinishSelector from "./FinishSelector";
import { DrawLine, DriftWave, RevealImage } from "./motion";

// Portafolio comercial (PDF "Preliminar High Gloss / Ultra Matte") llevado
// a secciones web, en el mismo orden que el documento. Todo el copy sale de
// src/app/portafolio.ts; aca solo vive la composicion.
//
// Contraste (WCAG AA): sobre fondos claros el texto va en charcoal y el
// secundario en taupe (4.7:1); el beige solo se usa como texto sobre
// charcoal (5.2:1) o como detalle decorativo.

// Usa la version de alta resolucion en cuanto exista (ver `hiRes` en
// portafolio.ts), sin tocar los componentes.
function resolve(image: PortfolioImage) {
  return image.hiRes ?? { src: image.src, width: image.width, height: image.height };
}

type Tone = "light" | "dark";

function Eyebrow({ children, tone = "light" }: { children: string; tone?: Tone }) {
  return (
    <p
      className={`flex items-center gap-3 font-corazza-sans text-[11px] font-semibold tracking-[0.26em] ${
        tone === "dark" ? "text-corazza-beige" : "text-corazza-taupe"
      }`}
    >
      <span aria-hidden className={`h-px w-6 ${tone === "dark" ? "bg-corazza-beige/70" : "bg-corazza-taupe/60"}`} />
      {children}
    </p>
  );
}

const TITLE =
  "font-corazza-serif font-medium leading-[1.05] tracking-[-0.01em] text-balance";

// --- Pagina 1 ------------------------------------------------------------------
function Portada() {
  const img = resolve(PORTFOLIO_IMAGES.cocina);
  return (
    <section id="portafolio" aria-labelledby="portada-titulo" className="scroll-mt-4 bg-corazza-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-8 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-12 lg:items-end lg:gap-16 lg:pb-12 lg:pt-32">
        <div className="lg:col-span-5 lg:pb-10">
          <Reveal>
            <Eyebrow>{PORTADA.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              id="portada-titulo"
              className={`${TITLE} mt-6 text-[2.75rem] text-corazza-charcoal sm:text-6xl lg:text-[4.25rem]`}
            >
              {PORTADA.title}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-8 font-corazza-sans text-sm font-medium tracking-[0.14em] text-corazza-taupe">
              {PORTADA.tagline.join(" • ")}
            </p>
          </Reveal>
        </div>

        <RevealImage className="relative aspect-[4/5] w-full rounded-2xl bg-corazza-cream lg:col-span-7 lg:aspect-[6/7]">
          <Image
            src={img.src}
            width={img.width}
            height={img.height}
            alt={PORTFOLIO_IMAGES.cocina.alt}
            sizes="(min-width: 1152px) 640px, (min-width: 1024px) 56vw, 100vw"
            className="h-full w-full object-cover"
          />
        </RevealImage>
      </div>
    </section>
  );
}

// --- Pagina 2 ------------------------------------------------------------------
function Manifiesto() {
  return (
    <section aria-labelledby="manifiesto-titulo" className="relative bg-corazza-white">
      <DriftWave className="absolute inset-x-0 top-6" toneClassName="text-corazza-beige/40" waveClassName="h-14" />
      <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:px-8 sm:py-32">
        <Reveal className="flex justify-center">
          <Eyebrow>{MANIFIESTO.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            id="manifiesto-titulo"
            className={`${TITLE} mx-auto mt-7 max-w-3xl text-[2.75rem] text-corazza-charcoal sm:text-6xl lg:text-7xl`}
          >
            {MANIFIESTO.title}
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-8 max-w-xl font-corazza-sans text-base leading-relaxed text-corazza-charcoal/85 sm:text-lg">
            {MANIFIESTO.body}
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          {/* Una sola linea desde sm (como en el PDF); en movil se apila
              para que ningun separador quede colgando al inicio de linea. */}
          <p className="mt-12 flex flex-col items-center gap-3 font-corazza-sans text-xs font-semibold tracking-[0.28em] text-corazza-taupe sm:flex-row sm:justify-center sm:gap-8 sm:text-[13px]">
            {MANIFIESTO.values.map((value, i) => (
              <span key={value} className="flex items-center gap-8">
                {i > 0 && <span aria-hidden className="hidden h-px w-10 bg-corazza-beige sm:block" />}
                {value}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// --- Pagina 3 ------------------------------------------------------------------
function Solucion() {
  const img = resolve(PORTFOLIO_IMAGES.detalle);
  return (
    <section aria-labelledby="solucion-titulo" className="bg-corazza-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-24 sm:px-8 sm:pb-32 md:grid-cols-12 md:gap-12 lg:gap-20">
        {/* Imagen de baja resolucion en el PDF (340 x 512): se muestra a un
            tamaño contenido, con un plano de color desplazado detras que le
            da presencia sin estirarla. */}
        <div className="relative mx-auto w-full max-w-[20rem] md:col-span-5 md:max-w-none lg:col-span-4 lg:col-start-2">
          <span aria-hidden className="absolute -bottom-5 -right-5 h-full w-full rounded-2xl bg-corazza-cream/70 sm:-bottom-6 sm:-right-6" />
          <RevealImage className="relative aspect-[340/512] w-full rounded-2xl bg-corazza-cream">
            <Image
              src={img.src}
              width={img.width}
              height={img.height}
              alt={PORTFOLIO_IMAGES.detalle.alt}
              sizes="(min-width: 768px) 340px, 320px"
              className="h-full w-full object-cover"
            />
          </RevealImage>
        </div>

        <div className="md:col-span-7 lg:col-span-6 lg:col-start-7">
          <Reveal>
            <Eyebrow>{SOLUCION.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="solucion-titulo" className={`${TITLE} mt-6 text-4xl text-corazza-charcoal sm:text-5xl lg:text-[3.5rem]`}>
              {SOLUCION.title}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-7 max-w-md font-corazza-sans text-base leading-relaxed text-corazza-charcoal/85 sm:text-lg">
              {SOLUCION.body}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// --- Pagina 4 ------------------------------------------------------------------
function Superficies() {
  return (
    <section
      id="superficies"
      aria-labelledby="superficies-titulo"
      className="scroll-mt-4 bg-corazza-cream/45"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <Reveal>
            {/* Taupe sobre esta franja crema no llega a AA en 11px: aqui la
                etiqueta va en charcoal. */}
            <p className="flex items-center gap-3 font-corazza-sans text-[11px] font-semibold tracking-[0.26em] text-corazza-charcoal">
              <span aria-hidden className="h-px w-6 bg-corazza-charcoal/50" />
              {SUPERFICIES.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="superficies-titulo" className={`${TITLE} mt-6 text-4xl text-corazza-charcoal sm:text-5xl lg:text-[3.5rem]`}>
              {SUPERFICIES.title}
            </h2>
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-x-6 sm:gap-x-10 lg:grid-cols-3">
          {SUPERFICIES.items.map((item, i) => (
            <li key={item} className="border-t border-corazza-charcoal/15">
              <Reveal delay={i * 0.05} y={12}>
                <p className="py-6 font-corazza-serif text-[1.6rem] font-medium leading-tight text-corazza-charcoal sm:py-8 sm:text-4xl">
                  {item}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// --- Pagina 5 ------------------------------------------------------------------
function Aplicaciones() {
  const img = resolve(PORTFOLIO_IMAGES.cocina);
  return (
    <section aria-labelledby="aplicaciones-titulo" className="bg-corazza-white">
      <div className="mx-auto max-w-6xl px-6 pt-24 sm:px-8 sm:pt-32">
        {/* Misma fotografia de la portada, en encuadre panoramico sobre la
            isla y el piso: otra lectura del espacio, no una copia del bloque
            anterior. El texto nunca va encima de la foto (panel solido). */}
        <RevealImage className="relative aspect-[4/3] w-full rounded-2xl bg-corazza-cream sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src={img.src}
            width={img.width}
            height={img.height}
            alt=""
            sizes="(min-width: 1152px) 1088px, 100vw"
            className="h-full w-full object-cover object-[center_62%]"
          />
        </RevealImage>

        <div className="relative -mt-12 ml-4 mr-0 rounded-2xl bg-corazza-white p-7 shadow-[0_24px_60px_-30px_rgba(58,43,32,0.45)] sm:-mt-20 sm:ml-10 sm:max-w-lg sm:p-10 lg:-mt-28 lg:ml-14">
          <Reveal>
            <Eyebrow>{APLICACIONES.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="aplicaciones-titulo" className={`${TITLE} mt-5 text-4xl text-corazza-charcoal sm:text-5xl`}>
              {APLICACIONES.title}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 font-corazza-sans text-base leading-relaxed text-corazza-charcoal/85">
              {APLICACIONES.body}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// --- Pagina 6 ------------------------------------------------------------------
function Beneficios() {
  return (
    <section aria-labelledby="beneficios-titulo" className="bg-corazza-white">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-32">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>{BENEFICIOS.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="beneficios-titulo" className={`${TITLE} mt-6 text-4xl text-corazza-charcoal sm:text-5xl lg:text-[3.5rem]`}>
              {BENEFICIOS.title}
            </h2>
          </Reveal>
        </div>

        <ol className="mt-16 grid grid-cols-1 gap-x-16 sm:grid-cols-2">
          {BENEFICIOS.items.map((item, i) => (
            <li key={item.number} className="border-t border-corazza-charcoal/10">
              <Reveal delay={(i % 2) * 0.08} y={14}>
                <div className="flex gap-6 py-8 sm:py-10">
                  <span className="w-12 flex-shrink-0 font-corazza-serif text-[2.5rem] font-medium leading-none text-corazza-taupe">
                    {item.number}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-corazza-sans text-base font-semibold text-corazza-charcoal sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-corazza-sans text-[15px] leading-relaxed text-corazza-taupe">
                      {item.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// --- Pagina 7 (pasos secuenciales) -------------------------------------------
function Servicio() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="servicio-titulo"
      className="scroll-mt-4 bg-corazza-cream/45"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <Reveal>
            <p className="flex items-center gap-3 font-corazza-sans text-[11px] font-semibold tracking-[0.26em] text-corazza-charcoal">
              <span aria-hidden className="h-px w-6 bg-corazza-charcoal/50" />
              {SERVICIO.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="servicio-titulo" className={`${TITLE} mt-6 text-4xl text-corazza-charcoal sm:text-5xl lg:text-[3.5rem]`}>
              {SERVICIO.title}
            </h2>
          </Reveal>
        </div>

        {/* Linea de tiempo: vertical en movil, horizontal desde lg. El
            numero va dentro de un circulo sobre la linea -- el orden de los
            pasos es parte del contenido. */}
        <div className="relative mt-16">
          <DrawLine
            orientation="vertical"
            className="absolute bottom-6 left-6 top-6 w-px bg-corazza-charcoal/25 lg:hidden"
          />
          <DrawLine
            orientation="horizontal"
            className="absolute left-6 right-6 top-6 hidden h-px bg-corazza-charcoal/25 lg:block"
          />
          <ol className="relative grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-8">
            {SERVICIO.steps.map((step, i) => (
              <li key={step.number}>
                <Reveal delay={i * 0.12} y={14} className="flex gap-6 lg:flex-col lg:gap-7">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-corazza-charcoal/25 bg-corazza-white font-corazza-serif text-xl font-semibold text-corazza-charcoal">
                    {step.number}
                  </span>
                  <div className="pt-2 lg:pt-0">
                    <h3 className="font-corazza-sans text-lg font-semibold text-corazza-charcoal">{step.title}</h3>
                    <p className="mt-2 max-w-xs font-corazza-sans text-[15px] leading-relaxed text-corazza-charcoal/80">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// --- Pagina 8 ------------------------------------------------------------------
function Experiencia() {
  const img = resolve(PORTFOLIO_IMAGES.kit);
  return (
    <section aria-labelledby="experiencia-titulo" className="bg-corazza-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-24 sm:px-8 sm:py-32 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <Reveal>
            <Eyebrow>{EXPERIENCIA.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="experiencia-titulo" className={`${TITLE} mt-6 text-4xl text-corazza-charcoal sm:text-5xl lg:text-[3.5rem]`}>
              {EXPERIENCIA.title}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-7 max-w-md font-corazza-sans text-base leading-relaxed text-corazza-charcoal/85 sm:text-lg">
              {EXPERIENCIA.body}
            </p>
          </Reveal>
          <ul className="mt-10 flex flex-col gap-5">
            {EXPERIENCIA.items.map((item, i) => (
              <li key={item}>
                <Reveal delay={0.2 + i * 0.06} y={10} className="flex items-center gap-4">
                  <span aria-hidden className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-corazza-beige" />
                  <span className="font-corazza-sans text-base font-semibold text-corazza-charcoal">{item}</span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <RevealImage className="relative aspect-square w-full rounded-2xl bg-corazza-cream lg:col-span-7">
          <Image
            src={img.src}
            width={img.width}
            height={img.height}
            alt={PORTFOLIO_IMAGES.kit.alt}
            sizes="(min-width: 1152px) 640px, (min-width: 1024px) 56vw, 100vw"
            className="h-full w-full object-cover"
          />
        </RevealImage>
      </div>
    </section>
  );
}

// --- Pagina 9 ------------------------------------------------------------------
function Tecnologia() {
  return (
    <section aria-labelledby="tecnologia-titulo" className="relative overflow-hidden bg-corazza-charcoal">
      <div className="pointer-events-none absolute inset-x-0 top-0 rotate-180 opacity-[0.12]">
        <WaveDivider toneClassName="text-corazza-beige" className="h-20" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-32">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow tone="dark">{TECNOLOGIA.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="tecnologia-titulo" className={`${TITLE} mt-6 text-4xl text-corazza-white sm:text-5xl lg:text-[3.5rem]`}>
              {TECNOLOGIA.title}
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mt-14">
          <FinishSelector finishes={TECNOLOGIA.finishes} />
        </Reveal>

        {/* Nota del PDF sobre la vida util estimada: visible y de alto
            contraste, alineada bajo la ficha tecnica a la que se refiere. */}
        <Reveal delay={0.1} y={10} className="mt-8 lg:grid lg:grid-cols-12 lg:gap-10">
          <aside
            role="note"
            aria-label="Nota sobre la vida útil estimada"
            className="flex gap-4 rounded-2xl border border-corazza-beige/50 px-5 py-5 sm:px-7 lg:col-span-8 lg:col-start-5"
          >
            <NoticeIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-corazza-beige" />
            <p className="font-corazza-sans text-sm leading-relaxed text-corazza-white/90">{TECNOLOGIA.footnote}</p>
          </aside>
        </Reveal>
      </div>

      <DriftWave className="relative" toneClassName="text-corazza-beige/25" waveClassName="h-12" />
    </section>
  );
}

export default function Portafolio() {
  return (
    <>
      <Portada />
      <Manifiesto />
      <Solucion />
      <Superficies />
      <Aplicaciones />
      <Beneficios />
      <Servicio />
      <Experiencia />
      <Tecnologia />
    </>
  );
}
