import type { Metadata } from "next";
import { Suspense } from "react";
import WhatsAppPanel from "./WhatsAppPanel";

// Panel interno: escribir a clientes por WhatsApp desde el numero de Corazza
// o el de un tecnico (corazza.com.do/panel/whatsapp). No se enlaza desde la
// web, no aparece en buscadores y pide clave.
export const metadata: Metadata = {
  title: { absolute: "Panel Corazza · WhatsApp" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function WhatsAppPage() {
  return (
    <Suspense>
      <WhatsAppPanel />
    </Suspense>
  );
}
