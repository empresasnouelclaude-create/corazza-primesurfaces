import type { Metadata } from "next";
import Calculadora from "./Calculadora";
import { TEXT } from "./config.ts";

// Herramienta interna de ventas en corazza.com.do/calculadora. No se enlaza
// desde la landing y se excluye de buscadores (noindex). No tiene login:
// quien tenga el enlace puede usarla (ver README para protegerla).
export const metadata: Metadata = {
  title: { absolute: TEXT.appTitle },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: "/calculadora" },
};

export default function CalculadoraPage() {
  return <Calculadora />;
}
