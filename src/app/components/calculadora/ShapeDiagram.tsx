import type { ShapeId } from "../../calculadora/config";

// Diagramas lineales propios de cada forma (SVG, sin imagenes). Trazo fino
// charcoal sobre relleno crema, como un plano de arquitectura. En L y U cada
// tramo lleva su numero, y el tramo activo (el del campo con foco) se
// resalta en beige para que se entienda que medida corresponde a cual.
//
// `detailed` agrega cotas (lineas de medida con su nombre) para el paso 2.

type Rect = { x: number; y: number; w: number; h: number };

const PIECES: Record<Exclude<ShapeId, "circular">, Rect[]> = {
  rectangular: [{ x: 18, y: 26, w: 84, h: 38 }],
  salpicadero: [{ x: 12, y: 18, w: 96, h: 40 }],
  // Tramo 1 de punta a punta; tramo 2 desde su borde (sin solape).
  l: [
    { x: 16, y: 14, w: 88, h: 22 },
    { x: 16, y: 36, w: 22, h: 42 },
  ],
  // Laterales de punta a punta; tramo 2 entre los laterales.
  u: [
    { x: 12, y: 14, w: 22, h: 64 },
    { x: 34, y: 14, w: 52, h: 22 },
    { x: 86, y: 14, w: 22, h: 64 },
  ],
  personalizada: [
    { x: 14, y: 20, w: 52, h: 34 },
    { x: 66, y: 32, w: 40, h: 40 },
  ],
};

function Badge({ x, y, n, active }: { x: number; y: number; n: number; active: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={6.5} className={active ? "fill-corazza-charcoal" : "fill-corazza-taupe"} />
      <text
        x={x}
        y={y + 2.4}
        textAnchor="middle"
        className="fill-corazza-white font-corazza-sans text-[7px] font-semibold [font-variant-numeric:lining-nums]"
      >
        {n}
      </text>
    </g>
  );
}

// Cota: linea con topes en los extremos y etiqueta centrada.
function Dim({
  x1,
  y1,
  x2,
  y2,
  label,
  side,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  side: "top" | "bottom" | "left" | "right";
}) {
  const vertical = x1 === x2;
  const tick = 2.5;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const offset = { top: [0, -4], bottom: [0, 8], left: [-4, 2], right: [4, 2] }[side];
  const anchor = side === "left" ? "end" : side === "right" ? "start" : "middle";
  return (
    <g className="stroke-corazza-taupe" strokeWidth={0.6}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {vertical ? (
        <>
          <line x1={x1 - tick} y1={y1} x2={x1 + tick} y2={y1} />
          <line x1={x2 - tick} y1={y2} x2={x2 + tick} y2={y2} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - tick} x2={x1} y2={y1 + tick} />
          <line x1={x2} y1={y2 - tick} x2={x2} y2={y2 + tick} />
        </>
      )}
      <text
        x={mx + offset[0]}
        y={my + offset[1]}
        textAnchor={anchor}
        stroke="none"
        className="fill-corazza-taupe font-corazza-sans text-[5.5px] font-semibold tracking-[0.08em]"
      >
        {label}
      </text>
    </g>
  );
}

export default function ShapeDiagram({
  shape,
  activePiece = null,
  detailed = false,
  className = "",
}: {
  shape: ShapeId;
  activePiece?: number | null;
  detailed?: boolean;
  className?: string;
}) {
  const numbered = shape === "l" || shape === "u" || (shape === "personalizada" && detailed);
  const pieceClass = (i: number) =>
    `transition-colors duration-200 ${
      activePiece === i ? "fill-corazza-beige/55 stroke-corazza-charcoal" : "fill-corazza-cream/45 stroke-corazza-charcoal/80"
    }`;

  return (
    <svg
      viewBox={detailed ? "-30 -6 180 104" : "0 0 120 92"}
      className={className}
      aria-hidden
      fill="none"
    >
      {shape === "circular" ? (
        <>
          <circle cx={60} cy={46} r={32} strokeWidth={1.2} className={pieceClass(0)} />
          <line x1={28} y1={46} x2={92} y2={46} strokeWidth={0.6} strokeDasharray="2 2" className="stroke-corazza-charcoal/40" />
          {detailed && <Dim x1={28} y1={86} x2={92} y2={86} label="DIÁMETRO" side="bottom" />}
        </>
      ) : (
        <>
          {shape === "salpicadero" && (
            // Linea del tope sobre el que se apoya el salpicadero.
            <line x1={4} y1={62} x2={116} y2={62} strokeWidth={2.4} className="stroke-corazza-charcoal/70" strokeLinecap="round" />
          )}
          {PIECES[shape].map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={1}
              strokeWidth={1.2}
              strokeDasharray={shape === "personalizada" ? "3 2" : undefined}
              className={pieceClass(i)}
            />
          ))}
          {numbered &&
            PIECES[shape].map((r, i) => (
              <Badge key={i} x={r.x + r.w / 2} y={r.y + r.h / 2} n={i + 1} active={activePiece === i} />
            ))}

          {detailed && shape === "rectangular" && (
            <>
              <Dim x1={18} y1={18} x2={102} y2={18} label="LARGO" side="top" />
              <Dim x1={110} y1={26} x2={110} y2={64} label="ANCHO" side="right" />
            </>
          )}
          {detailed && shape === "salpicadero" && (
            <>
              <Dim x1={12} y1={10} x2={108} y2={10} label="LARGO" side="top" />
              <Dim x1={4} y1={18} x2={4} y2={58} label="ALTO" side="left" />
            </>
          )}
          {detailed && shape === "l" && (
            <>
              <Dim x1={16} y1={6} x2={104} y2={6} label="LARGO 1" side="top" />
              <Dim x1={112} y1={14} x2={112} y2={36} label="ANCHO 1" side="right" />
              <Dim x1={8} y1={36} x2={8} y2={78} label="LARGO 2" side="left" />
              <Dim x1={16} y1={86} x2={38} y2={86} label="ANCHO 2" side="bottom" />
            </>
          )}
          {detailed && shape === "u" && (
            <>
              <Dim x1={4} y1={14} x2={4} y2={78} label="LARGO 1" side="left" />
              <Dim x1={34} y1={6} x2={86} y2={6} label="LARGO 2" side="top" />
              <Dim x1={116} y1={14} x2={116} y2={78} label="LARGO 3" side="right" />
              <Dim x1={12} y1={86} x2={34} y2={86} label="ANCHO 1" side="bottom" />
              <Dim x1={86} y1={86} x2={108} y2={86} label="ANCHO 3" side="bottom" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
