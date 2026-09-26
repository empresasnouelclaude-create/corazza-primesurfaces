import Care from "./components/Care";
import Footer from "./components/Footer";
import Gallery from "./components/Gallery";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import LinksList from "./components/LinksList";
import Surfaces from "./components/Surfaces";

// Landing "link in bio" de Corazza Prime Surfaces: una sola pagina vertical,
// con scroll suave nativo (ver "scroll-smooth" en el <main>) y navegacion
// por anclas desde los botones de LinksList -- sin menu fijo aparte, el
// propio bloque de enlaces grandes debajo del hero cumple ese rol.
export default function CorazzaPage() {
  return (
    <main className="scroll-smooth">
      <Hero />
      <LinksList />
      <HowItWorks />
      <Surfaces />
      <Gallery />
      <Care />
      <Footer />
    </main>
  );
}
