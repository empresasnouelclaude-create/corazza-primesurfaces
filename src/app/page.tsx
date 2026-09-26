import Footer from "./components/Footer";
import Hero from "./components/Hero";
import LinksList from "./components/LinksList";

// Landing "link in bio" de Corazza Prime Surfaces: una sola pagina vertical,
// con scroll suave nativo (ver "scroll-smooth" en el <main>) y navegacion
// por anclas desde los botones de LinksList -- sin menu fijo aparte, el
// propio bloque de enlaces grandes debajo del hero cumple ese rol.
//
// ARCHIVADO (a proposito, no un olvido): "Como funciona", "Superficies que
// protegemos", "Antes y despues" y "Cuidados y garantia" no se muestran
// todavia -- el cliente aun no tiene el contenido redactado para esas
// secciones y prefiere no mostrarlas a medio escribir. Sus componentes
// siguen intactos en ./components/ (HowItWorks.tsx, Surfaces.tsx,
// Gallery.tsx, Care.tsx): para publicarlas, se importan de vuelta aca y se
// agregan al <main>, y en LinkButton/LinksList/Hero se quita `disabled`
// (y el href="#..." vuelve a apuntar a la seccion real) de sus 4 botones
// correspondientes.
export default function CorazzaPage() {
  return (
    <main className="scroll-smooth">
      <Hero />
      <LinksList />
      <Footer />
    </main>
  );
}
