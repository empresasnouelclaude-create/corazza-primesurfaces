"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import WaveDivider from "../WaveDivider";

// Piezas de movimiento del portafolio. Todas son discretas y todas se
// apagan por completo con prefers-reduced-motion (el contenido se muestra
// en su estado final, sin desplazamiento ni fundido; mismo arbol en servidor
// y cliente para no romper la hidratacion). Misma curva que
// Reveal.tsx para que la pagina se sienta como una sola pieza.
const EASE = [0.16, 1, 0.3, 1] as const;

// Fotografia que "asienta" al entrar en pantalla: un leve acercamiento que
// se relaja (1.05 -> 1). Solo transform + opacity. El contenedor recorta,
// asi que no hay saltos de layout.
export function RevealImage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="relative h-full w-full"
        initial={{ opacity: 0, scale: 1.05 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={reduce ? { duration: 0 } : { duration: 1.2, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Linea que conecta los pasos de "Nuestro servicio": se dibuja en el mismo
// sentido de lectura (izquierda -> derecha en escritorio, arriba -> abajo
// en movil) para reforzar que el orden importa.
export function DrawLine({
  orientation,
  className = "",
}: {
  orientation: "horizontal" | "vertical";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const horizontal = orientation === "horizontal";

  return (
    <motion.span
      aria-hidden
      className={className}
      style={{ originX: 0, originY: 0 }}
      initial={horizontal ? { scaleX: 0 } : { scaleY: 0 }}
      whileInView={horizontal ? { scaleX: 1 } : { scaleY: 1 }}
      // Margen solo abajo: la linea arranca con escala 0 (ancho o alto
      // cero) y, cerca del borde lateral en movil, un margen negativo en
      // los cuatro lados la dejaba fuera del area observada para siempre.
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 1.4, ease: EASE, delay: 0.15 }}
    />
  );
}

// Onda de marca como separador, con una deriva horizontal minima (pocos px)
// ligada al scroll -- nunca un loop, nunca protagonista.
export function DriftWave({
  className = "",
  toneClassName,
  waveClassName = "h-16",
  range = 20,
}: {
  className?: string;
  toneClassName?: string;
  waveClassName?: string;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
      <motion.div style={{ x: reduce ? 0 : x }} className="-mx-8">
        <WaveDivider toneClassName={toneClassName} className={waveClassName} />
      </motion.div>
    </div>
  );
}
