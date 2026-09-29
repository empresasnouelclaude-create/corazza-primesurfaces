import Footer from "./components/Footer";
import Hero from "./components/Hero";
import LinksList from "./components/LinksList";
import CalculatorSection from "./components/calculadora/CalculatorSection";
import Portafolio from "./components/portafolio/Portafolio";

// Landing "link in bio" de Corazza Prime Surfaces: una sola pagina vertical,
// con scroll suave nativo (ver "scroll-smooth" en el <main>) y navegacion
// por anclas desde los botones de LinksList -- sin menu fijo aparte, el
// propio bloque de enlaces grandes debajo del hero cumple ese rol.
//
// PORTAFOLIO (entre los enlaces y el footer): las secciones del portafolio
// comercial oficial (PDF "Preliminar High Gloss / Ultra Matte"), con su
// texto literal centralizado en ./portafolio.ts. Dos de esas secciones usan
// los anclajes que ya existian en los botones de la landing:
// #como-funciona (NUESTRO SERVICIO) y #superficies (SUPERFICIES), asi que
// esos botones quedan activos con el mismo href de siempre.
//
// CALCULA TU SUPERFICIE (#calcula): herramienta interactiva justo despues
// de SUPERFICIES. Formas, textos y limites en ./calculadora/config.ts;
// formulas (con pruebas: npm test) en ./calculadora/formulas.ts.
//
// ARCHIVADO (a proposito, no un olvido): "Antes y despues" y "Cuidados y
// garantia" siguen sin mostrarse -- el PDF no trae contenido para ellas.
// Sus componentes siguen intactos en ./components/ (Gallery.tsx, Care.tsx),
// igual que las versiones anteriores de HowItWorks.tsx y Surfaces.tsx (ya
// reemplazadas por las del portafolio). Para publicar Galeria/Cuidados, se
// importan de vuelta aca y en LinksList se quita `disabled` de su boton.
export default function CorazzaPage() {
  return (
    <main className="scroll-smooth">
      <Hero />
      <LinksList />
      <Portafolio afterSuperficies={<CalculatorSection />} />
      <Footer />
    </main>
  );
}
