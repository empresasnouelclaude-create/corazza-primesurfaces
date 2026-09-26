import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import { CORAZZA_DOMAIN } from "./config";
import "./globals.css";

// Proyecto independiente para Corazza Prime Surfaces -- sin relacion con
// ninguna otra plataforma. Este es el layout raiz de verdad (pone
// <html>/<body>), con su propia tipografia (Cormorant Garamond +
// Montserrat) y su propia metadata.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-corazza-cormorant",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-corazza-montserrat",
});

const siteUrl = `https://${CORAZZA_DOMAIN}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    absolute: "Corazza Prime Surfaces | Protección premium para tus superficies",
  },
  description:
    "Protect · Preserve · Elevate. Protección premium para las superficies que forman parte de tus espacios: mármol, granito, cuarzo, porcelanato y más.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Corazza Prime Surfaces",
    description: "Protección premium para las superficies que forman parte de tus espacios.",
    url: siteUrl,
    siteName: "Corazza Prime Surfaces",
    images: [{ url: "/corazza-logo-cream.png", width: 1440, height: 620, alt: "Corazza Prime Surfaces" }],
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Corazza Prime Surfaces",
    description: "Protección premium para las superficies que forman parte de tus espacios.",
    images: ["/corazza-logo-cream.png"],
  },
  icons: {
    icon: "/corazza-isotipo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3A2B20",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body className="font-corazza-sans bg-corazza-white text-corazza-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
