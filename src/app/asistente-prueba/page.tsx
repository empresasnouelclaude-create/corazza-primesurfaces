import type { Metadata } from "next";
import Simulador from "./Simulador";

// Simulador interno del asistente de WhatsApp (corazza.com.do/asistente-prueba).
// No se enlaza desde la web, no aparece en buscadores y pide clave.
export const metadata: Metadata = {
  title: { absolute: "Asistente Corazza · Prueba" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AsistentePruebaPage() {
  return <Simulador />;
}
