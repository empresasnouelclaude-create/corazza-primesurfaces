import { SOCIAL_LINKS, WHATSAPP_LINKS } from "../config";
import {
  CompassIcon,
  ImagesIcon,
  InstagramIcon,
  LayersIcon,
  RulerIcon,
  ShieldIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "./CorazzaIcons";
import LinkButton from "./LinkButton";
import Reveal from "./Reveal";

// El corazon del formato "link in bio": los 7 accesos principales del
// brief, en un solo lugar, justo debajo del hero -- para que quien llega
// desde una bio de Instagram/TikTok encuentre todo sin tener que buscar.
export default function LinksList() {
  const links = [
    {
      href: WHATSAPP_LINKS.cotizar,
      label: "Cotiza tu superficie",
      Icon: WhatsAppIcon,
      variant: "solid" as const,
      external: true,
    },
    // "Como funciona" y "Superficies" apuntan a las secciones del
    // portafolio (NUESTRO SERVICIO y SUPERFICIES). Galeria y Cuidados siguen
    // archivadas hasta tener contenido (ver page.tsx) -- visibles en la lista
    // tal cual, pero "disabled" para que no naveguen a una seccion vacia.
    { href: "#como-funciona", label: "Conoce cómo funciona", Icon: CompassIcon },
    { href: "#superficies", label: "Superficies que protegemos", Icon: LayersIcon },
    { href: "#calcula", label: "Calcula tu superficie", Icon: RulerIcon },
    { href: "#galeria", label: "Antes y después", Icon: ImagesIcon, disabled: true },
    { href: "#cuidados", label: "Cuidados y garantía", Icon: ShieldIcon, disabled: true },
    {
      href: SOCIAL_LINKS.instagram,
      label: "Instagram",
      Icon: InstagramIcon,
      external: true,
    },
    { href: SOCIAL_LINKS.tiktok, label: "TikTok", Icon: TikTokIcon, external: true },
  ];

  return (
    <section className="bg-corazza-white">
      <div className="mx-auto max-w-xl px-6 py-14 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-3">
          {links.map((link, i) => (
            <Reveal key={link.label} delay={i * 0.04} y={12}>
              <LinkButton {...link} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
