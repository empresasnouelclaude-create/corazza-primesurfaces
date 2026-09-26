import type { ComponentType, SVGProps } from "react";
import { ArrowRightIcon } from "./CorazzaIcons";

// Boton grande de la lista de enlaces principales: icono a la izquierda,
// texto y flecha a la derecha. Un solo componente para los 7 enlaces del
// brief, en vez de repetir el marcado -- variant "solid" para el enlace mas
// importante (WhatsApp), "outline" para el resto, ambos con buen contraste
// (fondo oscuro solido/texto crema, o borde marcado sobre fondo claro).
//
// `disabled`: la seccion a la que apuntaba (Como funciona, Superficies,
// Antes/despues, Cuidados) esta archivada hasta tener contenido redactado
// (ver page.tsx) -- se muestra igual en la lista (mismo lugar, mismo
// aspecto) pero como <span>, no <a>: no es un enlace real, asi que no hay
// a donde navegar ni un href roto que "no haga nada" al hacer click.
export default function LinkButton({
  href,
  label,
  Icon,
  variant = "outline",
  external = false,
  disabled = false,
}: {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  variant?: "solid" | "outline";
  external?: boolean;
  disabled?: boolean;
}) {
  const base =
    "group flex w-full items-center gap-4 rounded-2xl px-5 py-4 font-corazza-sans text-[15px] font-medium tracking-wide transition-all duration-300 ease-out active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-taupe";

  const variants = {
    solid:
      "bg-corazza-charcoal text-corazza-white shadow-[0_10px_30px_-12px_rgba(58,43,32,0.55)] hover:bg-corazza-charcoal/90 hover:-translate-y-0.5",
    outline:
      "border border-corazza-charcoal/15 bg-corazza-white text-corazza-charcoal hover:border-corazza-taupe/50 hover:bg-corazza-cream/40 hover:-translate-y-0.5",
  } as const;

  const content = (
    <>
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          variant === "solid" ? "bg-corazza-white/15" : "bg-corazza-cream/70"
        }`}
        aria-hidden
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex-1 text-left">{label}</span>
      <ArrowRightIcon className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
    </>
  );

  if (disabled) {
    return (
      <span className={`${base} ${variants[variant]} cursor-default`} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${base} ${variants[variant]}`}
    >
      {content}
    </a>
  );
}
