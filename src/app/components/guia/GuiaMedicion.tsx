import { GUIA } from "../../guia-medicion";
import { DrawLine } from "../portafolio/motion";
import Reveal from "../Reveal";

// Guia "¿CÓMO MEDIR MI TOPE?" (#como-medir). Mismo contenido que las
// laminas de referencia, redibujado con la identidad de Corazza: trazo
// charcoal sobre relleno crema, piezas numeradas en circulos charcoal y
// cotas en taupe. Sin texto agregado (ver src/app/guia-medicion.ts).

type Shape =
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "poly"; points: string }
  | { kind: "circle"; cx: number; cy: number; r: number };
type Badge = { x: number; y: number; n: number };
type Dim = { x1: number; y1: number; x2: number; y2: number; label: string; side: "top" | "bottom" | "left" | "right" };

const { largo: LARGO, ancho: ANCHO, alto: ALTO, diametro: DIAMETRO } = GUIA.labels;

function Diagram({
  viewBox,
  shapes,
  badges,
  dims,
  labelledBy,
  className = "",
}: {
  viewBox: string;
  shapes: Shape[];
  badges: Badge[];
  dims: Dim[];
  labelledBy: string;
  className?: string;
}) {
  const tick = 3;
  return (
    <svg viewBox={viewBox} role="img" aria-labelledby={labelledBy} className={`h-auto w-full [text-rendering:geometricPrecision] ${className}`} fill="none">
      {shapes.map((s, i) => {
        const common = { strokeWidth: 1.4, className: "fill-corazza-cream/45 stroke-corazza-charcoal", strokeLinejoin: "round" as const };
        if (s.kind === "rect") return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={1.5} {...common} />;
        if (s.kind === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...common} />;
        return <polygon key={i} points={s.points} {...common} />;
      })}

      {dims.map((d, i) => {
        const vertical = d.x1 === d.x2;
        const mx = (d.x1 + d.x2) / 2;
        const my = (d.y1 + d.y2) / 2;
        const text: Record<Dim["side"], { x: number; y: number; anchor: "middle" | "start" | "end" }> = {
          top: { x: mx, y: d.y1 - 5, anchor: "middle" },
          bottom: { x: mx, y: d.y1 + 12, anchor: "middle" },
          left: { x: d.x1 - 6, y: my + 2.8, anchor: "end" },
          right: { x: d.x1 + 6, y: my + 2.8, anchor: "start" },
        };
        const t = text[d.side];
        return (
          <g key={i} className="stroke-corazza-taupe" strokeWidth={0.8}>
            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} />
            {vertical ? (
              <>
                <line x1={d.x1 - tick} y1={d.y1} x2={d.x1 + tick} y2={d.y1} />
                <line x1={d.x2 - tick} y1={d.y2} x2={d.x2 + tick} y2={d.y2} />
              </>
            ) : (
              <>
                <line x1={d.x1} y1={d.y1 - tick} x2={d.x1} y2={d.y1 + tick} />
                <line x1={d.x2} y1={d.y2 - tick} x2={d.x2} y2={d.y2 + tick} />
              </>
            )}
            <text
              x={t.x}
              y={t.y}
              textAnchor={t.anchor}
              stroke="none"
              className="fill-corazza-taupe font-corazza-sans text-[8.5px] font-semibold tracking-[0.04em]"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {badges.map((b) => (
        <g key={b.n}>
          <circle cx={b.x} cy={b.y} r={8} className="fill-corazza-charcoal" />
          <text
            x={b.x}
            y={b.y + 3}
            textAnchor="middle"
            className="fill-corazza-white font-corazza-sans text-[9px] font-semibold [font-variant-numeric:lining-nums]"
          >
            {b.n}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Titulo de cada lamina: "TOPE" ligero + nombre destacado, como en las
// referencias, pero en Cormorant.
function PanelTitle({ id, light, strong }: { id: string; light?: string; strong: string }) {
  return (
    <h3 id={id} className="font-corazza-serif text-[1.75rem] leading-none tracking-[0.04em] text-corazza-charcoal sm:text-[2rem]">
      {light && <span className="font-light">{light} </span>}
      <span className="font-semibold">{strong}</span>
    </h3>
  );
}

const PANEL = "flex h-full flex-col rounded-2xl border border-corazza-charcoal/15 bg-corazza-white p-6 sm:p-8";

// Piezas de las tres uniones del tope en L (mismas proporciones y cotas
// que la lamina de referencia).
const UNIONS: { shapes: Shape[]; badges: Badge[]; dims: Dim[] }[] = [
  {
    shapes: [
      { kind: "rect", x: 60, y: 22, w: 108, h: 40 },
      { kind: "rect", x: 60, y: 72, w: 42, h: 48 },
    ],
    badges: [
      { x: 81, y: 96, n: 1 },
      { x: 114, y: 42, n: 2 },
    ],
    dims: [
      { x1: 60, y1: 11, x2: 168, y2: 11, label: LARGO, side: "top" },
      { x1: 178, y1: 22, x2: 178, y2: 62, label: ANCHO, side: "right" },
      { x1: 50, y1: 72, x2: 50, y2: 120, label: LARGO, side: "left" },
      { x1: 60, y1: 130, x2: 102, y2: 130, label: ANCHO, side: "bottom" },
    ],
  },
  {
    shapes: [
      { kind: "rect", x: 60, y: 22, w: 42, h: 90 },
      { kind: "rect", x: 110, y: 22, w: 68, h: 40 },
    ],
    badges: [
      { x: 81, y: 67, n: 1 },
      { x: 144, y: 42, n: 2 },
    ],
    dims: [
      { x1: 50, y1: 22, x2: 50, y2: 112, label: LARGO, side: "left" },
      { x1: 60, y1: 122, x2: 102, y2: 122, label: ANCHO, side: "bottom" },
      { x1: 110, y1: 11, x2: 178, y2: 11, label: LARGO, side: "top" },
      { x1: 188, y1: 22, x2: 188, y2: 62, label: ANCHO, side: "right" },
    ],
  },
  {
    shapes: [
      { kind: "poly", points: "60,22 124,22 124,54 102,54 102,112 60,112" },
      { kind: "rect", x: 132, y: 22, w: 46, h: 32 },
    ],
    badges: [
      { x: 81, y: 60, n: 1 },
      { x: 155, y: 38, n: 2 },
    ],
    dims: [
      { x1: 60, y1: 11, x2: 124, y2: 11, label: ANCHO, side: "top" },
      { x1: 50, y1: 22, x2: 50, y2: 112, label: LARGO, side: "left" },
      { x1: 188, y1: 22, x2: 188, y2: 54, label: ANCHO, side: "right" },
      { x1: 132, y1: 64, x2: 178, y2: 64, label: LARGO, side: "bottom" },
    ],
  },
];

// Tope en U: dos uniones (tres piezas cada una). En ambas, el ANCHO de la
// pieza 2 se mide dentro de la pieza, como en la lamina de referencia.
const UNIONS_U: { shapes: Shape[]; badges: Badge[]; dims: Dim[] }[] = [
  {
    shapes: [
      { kind: "rect", x: 64, y: 24, w: 34, h: 92 },
      { kind: "rect", x: 106, y: 24, w: 84, h: 42 },
      { kind: "rect", x: 198, y: 24, w: 34, h: 92 },
    ],
    badges: [
      { x: 81, y: 70, n: 1 },
      { x: 174, y: 45, n: 2 },
      { x: 215, y: 70, n: 3 },
    ],
    dims: [
      { x1: 54, y1: 24, x2: 54, y2: 116, label: LARGO, side: "left" },
      { x1: 64, y1: 126, x2: 98, y2: 126, label: ANCHO, side: "bottom" },
      { x1: 106, y1: 13, x2: 190, y2: 13, label: LARGO, side: "top" },
      { x1: 159, y1: 29, x2: 159, y2: 61, label: ANCHO, side: "left" },
      { x1: 242, y1: 24, x2: 242, y2: 116, label: LARGO, side: "right" },
      { x1: 198, y1: 126, x2: 232, y2: 126, label: ANCHO, side: "bottom" },
    ],
  },
  {
    shapes: [
      { kind: "rect", x: 64, y: 72, w: 40, h: 44 },
      { kind: "rect", x: 64, y: 22, w: 160, h: 42 },
      { kind: "rect", x: 184, y: 72, w: 40, h: 44 },
    ],
    badges: [
      { x: 84, y: 94, n: 1 },
      { x: 176, y: 43, n: 2 },
      { x: 204, y: 94, n: 3 },
    ],
    dims: [
      { x1: 64, y1: 11, x2: 224, y2: 11, label: LARGO, side: "top" },
      { x1: 160, y1: 27, x2: 160, y2: 59, label: ANCHO, side: "left" },
      { x1: 54, y1: 72, x2: 54, y2: 116, label: LARGO, side: "left" },
      { x1: 64, y1: 126, x2: 104, y2: 126, label: ANCHO, side: "bottom" },
      { x1: 234, y1: 72, x2: 234, y2: 116, label: LARGO, side: "right" },
      { x1: 184, y1: 126, x2: 224, y2: 126, label: ANCHO, side: "bottom" },
    ],
  },
];

// Lamina de uniones (tope en L y tope en U): titulo, frase de la lamina y
// un diagrama por union.
function UnionsPanel({
  id,
  content,
  unions,
  viewBox,
  columns,
}: {
  id: string;
  content: { title: { light: string; strong: string }; intro: { before: string; strong: string; after: string }; unions: readonly string[] };
  unions: { shapes: Shape[]; badges: Badge[]; dims: Dim[] }[];
  viewBox: string;
  columns: string;
}) {
  return (
    <article className="rounded-2xl border border-corazza-charcoal/15 bg-corazza-cream/25 p-4 sm:p-8 lg:p-10">
      <div className="px-2 pt-2 sm:p-0">
        <PanelTitle id={id} light={content.title.light} strong={content.title.strong} />
      </div>
      <p className="mt-3 px-2 sm:px-0 font-corazza-sans text-base text-corazza-charcoal sm:text-lg">
        {content.intro.before} <strong className="font-semibold">{content.intro.strong}</strong> {content.intro.after}
      </p>
      <ol className={`mt-8 grid grid-cols-1 gap-5 ${columns}`}>
        {unions.map((u, i) => (
          <li key={content.unions[i]} className="flex flex-col rounded-2xl bg-corazza-white p-3 pt-4 sm:p-6">
            <p
              id={`${id}-union-${i + 1}`}
              className="ml-1 self-start rounded-full bg-corazza-charcoal px-4 sm:ml-0 py-1.5 font-corazza-sans text-xs font-semibold tracking-[0.16em] text-corazza-white"
            >
              {content.unions[i]}
            </p>
            <Diagram
              labelledBy={`${id} ${id}-union-${i + 1}`}
              viewBox={viewBox}
              className="mt-5"
              shapes={u.shapes}
              badges={u.badges}
              dims={u.dims}
            />
          </li>
        ))}
      </ol>
    </article>
  );
}

export default function GuiaMedicion() {
  return (
    <section id="como-medir" aria-labelledby="como-medir-titulo" className="relative scroll-mt-4 overflow-hidden bg-corazza-white">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:px-8 sm:py-28">
        {/* Portada: ¿CÓMO / MEDIR / MI TOPE? + una cinta metrica como trazo. */}
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <h2
              id="como-medir-titulo"
              className="font-corazza-serif leading-[0.95] tracking-[0.02em] text-corazza-charcoal"
            >
              <span className="block text-4xl font-light sm:text-5xl">{GUIA.title.before}</span>
              <span className="block text-[4rem] font-semibold sm:text-[5.5rem]">{GUIA.title.strong}</span>
              <span className="block text-4xl font-light sm:text-5xl">{GUIA.title.after}</span>
            </h2>
          </Reveal>
          <div aria-hidden className="pb-3 lg:col-span-7">
            <DrawLine
              orientation="horizontal"
              className="block h-7 w-full rounded-sm border border-corazza-beige/60 bg-corazza-cream/40 bg-[repeating-linear-gradient(90deg,#B89C82_0_1px,transparent_1px_60px),repeating-linear-gradient(90deg,#B89C82_0_1px,transparent_1px_12px)] bg-[length:100%_100%,100%_45%] bg-no-repeat"
            />
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Backsplash (salpicadero) */}
          <Reveal y={14} className="md:col-span-2 lg:col-span-1">
            <article className={PANEL}>
              <div>
                <PanelTitle id="guia-backsplash" strong={GUIA.backsplash.title} />
                <p className="mt-2 font-corazza-sans text-sm tracking-[0.06em] text-corazza-taupe">{GUIA.backsplash.subtitle}</p>
              </div>
              <div className="mt-8 flex flex-1 items-center">
                <Diagram
                  labelledBy="guia-backsplash"
                  viewBox="0 0 240 150"
                  shapes={[{ kind: "poly", points: "56,52 100,52 100,22 184,22 184,52 228,52 228,112 56,112" }]}
                  badges={[{ x: 142, y: 76, n: 1 }]}
                  dims={[
                    { x1: 44, y1: 22, x2: 44, y2: 112, label: ALTO, side: "left" },
                    { x1: 56, y1: 126, x2: 228, y2: 126, label: LARGO, side: "bottom" },
                  ]}
                />
              </div>
            </article>
          </Reveal>

          {/* Tope lineal */}
          <Reveal y={14} delay={0.06}>
            <article className={PANEL}>
              <PanelTitle id="guia-lineal" light={GUIA.lineal.title.light} strong={GUIA.lineal.title.strong} />
              <div className="mt-8 flex flex-1 items-center">
                <Diagram
                  labelledBy="guia-lineal"
                  viewBox="0 0 200 165"
                  className="mx-auto max-w-[15rem]"
                  shapes={[{ kind: "rect", x: 70, y: 28, w: 88, h: 120 }]}
                  badges={[{ x: 114, y: 88, n: 1 }]}
                  dims={[
                    { x1: 70, y1: 16, x2: 158, y2: 16, label: ANCHO, side: "top" },
                    { x1: 58, y1: 28, x2: 58, y2: 148, label: LARGO, side: "left" },
                  ]}
                />
              </div>
            </article>
          </Reveal>

          {/* Tope circular */}
          <Reveal y={14} delay={0.12}>
            <article className={PANEL}>
              <PanelTitle id="guia-circular" light={GUIA.circular.title.light} strong={GUIA.circular.title.strong} />
              <div className="mt-8 flex flex-1 items-center">
                <Diagram
                  labelledBy="guia-circular"
                  viewBox="0 0 220 150"
                  className="mx-auto max-w-[16rem]"
                  shapes={[{ kind: "circle", cx: 84, cy: 75, r: 58 }]}
                  badges={[{ x: 84, y: 75, n: 1 }]}
                  dims={[{ x1: 158, y1: 17, x2: 158, y2: 133, label: DIAMETRO, side: "right" }]}
                />
              </div>
            </article>
          </Reveal>
        </div>

        {/* Tope en L: tres uniones */}
        <Reveal y={14} className="mt-5">
          <UnionsPanel id="guia-l" content={GUIA.enL} unions={UNIONS} viewBox="10 0 220 142" columns="md:grid-cols-3" />
        </Reveal>

        {/* Tope en U: dos uniones */}
        <Reveal y={14} className="mt-5">
          <UnionsPanel id="guia-u" content={GUIA.enU} unions={UNIONS_U} viewBox="12 0 272 142" columns="md:grid-cols-2" />
        </Reveal>
      </div>
    </section>
  );
}
