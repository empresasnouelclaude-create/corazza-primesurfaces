import type { Metadata } from "next";
import Documentos from "./Documentos";

// Panel interno: documentos de Citrus (corazza.com.do/panel/documentos).
// No se enlaza desde la web, no aparece en buscadores y pide clave.
export const metadata: Metadata = {
  title: { absolute: "Panel Corazza · Documentos" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DocumentosPage() {
  return <Documentos />;
}
