import { SOCIAL_LINKS, WHATSAPP_LINKS } from "../config";
import {
  CompassIcon,
  ImagesIcon,
  InstagramIcon,
  LayersIcon,
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
    { href: "#como-funciona", label: "Conoce cómo funciona", Icon: CompassIcon },
    { href: "#superficies", label: "Superficies que protegemos", Icon: LayersIcon },
    { href: "#galeria", label: "Antes y después", Icon: ImagesIcon },
    { href: "#cuidados", label: "Cuidados y garantía", Icon: ShieldIcon },
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
