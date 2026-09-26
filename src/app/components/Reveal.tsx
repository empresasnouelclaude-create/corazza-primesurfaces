"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import type { ReactNode } from "react";

// Aparicion suave al entrar en pantalla, respetando prefers-reduced-motion
// (si esta activado, el contenido aparece directo, sin desplazamiento ni
// fundido) -- ver seccion 6.B de la guia de diseño: cualquier movimiento por
// encima de "sutil" debe poder apagarse por completo.
export default function Reveal({
  children,
  delay = 0,
  y = 18,
  duration = 0.7,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  const transition: Transition = {
    duration,
    delay,
    ease: [0.16, 1, 0.3, 1],
  };

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-72px" }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
