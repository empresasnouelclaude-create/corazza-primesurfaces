import Image from "next/image";
import { SOCIAL_LINKS } from "../config";
import { InstagramIcon, TikTokIcon } from "./CorazzaIcons";
import WaveDivider from "./WaveDivider";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-corazza-charcoal">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-[0.1]">
        <WaveDivider toneClassName="text-corazza-beige" className="h-16" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 py-14 text-center sm:px-8">
        <Image
          src="/corazza-isotipo.png"
          alt="Corazza"
          width={140}
          height={70}
          className="h-auto w-24 opacity-90"
        />
        <p className="font-corazza-sans text-[11px] font-semibold uppercase tracking-[0.32em] text-corazza-beige">
          Protect · Preserve · Elevate
        </p>

        <div className="flex items-center gap-5">
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Corazza en Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-corazza-white/20 text-corazza-white/80 transition-colors hover:border-corazza-beige hover:text-corazza-beige focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-beige"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
          <a
            href={SOCIAL_LINKS.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Corazza en TikTok"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-corazza-white/20 text-corazza-white/80 transition-colors hover:border-corazza-beige hover:text-corazza-beige focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corazza-beige"
          >
            <TikTokIcon className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-4 font-corazza-sans text-xs text-corazza-white/40">
          © {year} Corazza Prime Surfaces. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
