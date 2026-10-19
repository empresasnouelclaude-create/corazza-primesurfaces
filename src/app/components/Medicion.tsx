"use client";

import Script from "next/script";
import { useEffect } from "react";
import { enlaceConReferencia, referenciaDesde } from "@/lib/medicion.ts";

// Medicion de la web (montada una sola vez en layout.tsx):
//
// 1. Pixel de Meta: solo se carga si existe NEXT_PUBLIC_META_PIXEL_ID en
//    Vercel. Registra las visitas (PageView) y cada clic a WhatsApp
//    (evento Contact), para que los anuncios se optimicen hacia personas
//    que escriben.
// 2. Origen del clic: si la visita llego con UTM (por ejemplo desde un
//    anuncio), al abrir WhatsApp se agrega al final del mensaje una
//    referencia corta, "(ref: cafe)". Asi el equipo y el panel saben de que
//    anuncio vino cada cliente. Funciona aunque no haya Pixel.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CLAVE_ORIGEN = "corazza-origen";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function Medicion() {
  useEffect(() => {
    let ref: string | null = null;
    try {
      ref = referenciaDesde(window.location.search);
      if (ref) sessionStorage.setItem(CLAVE_ORIGEN, ref);
      else ref = sessionStorage.getItem(CLAVE_ORIGEN);
    } catch {}

    function alHacerClic(event: MouseEvent) {
      const enlace = (event.target as Element | null)?.closest?.('a[href*="wa.me/"]') as HTMLAnchorElement | null;
      if (!enlace) return;
      if (ref) enlace.href = enlaceConReferencia(enlace.href, ref);
      window.fbq?.("track", "Contact");
    }
    document.addEventListener("click", alHacerClic, true);
    return () => document.removeEventListener("click", alHacerClic, true);
  }, []);

  if (!PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(PIXEL_ID)});fbq('track', 'PageView');`}
    </Script>
  );
}
