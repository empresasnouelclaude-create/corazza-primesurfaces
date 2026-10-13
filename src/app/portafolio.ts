// ============================================================================
// CONTENIDO DEL PORTAFOLIO COMERCIAL (HIGH GLOSS / ULTRA MATTE)
//
// Fuente oficial: "Corazza_Preliminar_High_Gloss_Ultra_Matte.pdf" (9 paginas).
//
// REGLA: todo el texto de este archivo esta copiado LITERALMENTE del PDF --
// mismas palabras, ortografia, mayusculas, tildes, puntuacion, numeros y
// orden. No se resume ni se "mejora". Si el PDF cambia, se reemplaza aca el
// texto tal cual; los componentes de src/app/components/portafolio/ solo
// dan forma visual y no escriben copy propio (salvo textos alternativos de
// imagenes y etiquetas de accesibilidad).
//
// Notas de extraccion:
// - Pagina 1 (portada): su texto esta incrustado dentro de la imagen, no es
//   texto seleccionable. Se transcribio leyendo la pagina a alta resolucion.
// - Pagina 9: en el PDF las fichas quedan cortadas visualmente a la altura de
//   GARANTIA y VIDA UTIL ESTIMADA, pero sus valores estan completos en la
//   capa de texto del documento; se tomaron de ahi.
// - El pie de cada pagina ("CORAZZA | PRIME SURFACES" + numero de pagina) es
//   paginacion de impresion y no se reproduce como contenido.
// ============================================================================

// --- Imagenes ------------------------------------------------------------------
// Cada imagen declara su tamaño real para reservar espacio (sin saltos de
// layout). `hiRes` queda listo para cuando haya una version de mayor
// resolucion de la MISMA fotografia: al completarlo, los componentes la usan
// automaticamente en lugar de `src`, sin tocar ningun otro archivo.
export type PortfolioImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  hiRes?: { src: string; width: number; height: number };
};

export const PORTFOLIO_IMAGES = {
  // Pagina 1 del PDF: fotografia de la portada (1536 x 1024), recortada solo
  // en su mitad derecha para excluir el texto que venia incrustado encima
  // del panel oscuro. La fotografia en si no se modifico.
  // TODO(cliente): suministrar la fotografia original de la portada sin
  // texto y a mayor resolucion (ideal >= 1600 px de ancho) y agregarla en
  // `hiRes`.
  cocina: {
    src: "/portafolio/cocina-isla-marmol.jpg",
    width: 784,
    height: 1024,
    alt: "Cocina abierta con isla de mármol claro veteado, taburetes tapizados de madera y vista al mar a través de ventanales.",
  },
  // Fotografias propias de Corazza (generadas a pedido del cliente para no
  // repetir la cocina de la portada en varias secciones).
  comedor: {
    src: "/portafolio/comedor-mesa-marmol.webp",
    width: 1122,
    height: 1402,
    alt: "Comedor luminoso con mesa larga de mármol blanco veteado, sillas de roble tapizadas en lino, jarrón con ramas de olivo y ventanales con vista al mar.",
  },
  instalacion: {
    src: "/portafolio/instalacion-lamina.webp",
    width: 1024,
    height: 1536,
    alt: "Mano con guante aplicando con una espátula de fieltro una lámina transparente sobre el canto de un tope de mármol beige veteado.",
  },
  materiales: {
    src: "/portafolio/muestras-materiales.webp",
    width: 1672,
    height: 941,
    alt: "Muestras cuadradas de mármol blanco, granito negro, cuarzo gris, madera de nogal y porcelanato claro sobre un fondo de lino.",
  },
  panoramica: {
    src: "/portafolio/apartamento-panoramico.webp",
    width: 1916,
    height: 821,
    alt: "Apartamento abierto al atardecer con isla de cocina en travertino, barra y escritorio de nogal, y ventanales con vista al mar.",
  },
  gotas: {
    src: "/portafolio/gotas-marmol.webp",
    width: 1254,
    height: 1254,
    alt: "Gotas de agua sobre un tope de mármol pulido junto a una taza de café y una rodaja de limón.",
  },
  medicion: {
    src: "/portafolio/servicio-medicion.webp",
    width: 1448,
    height: 1086,
    alt: "Técnico midiendo con cinta métrica un tope de mármol claro, con un rollo de lámina transparente y una espátula sobre el tope.",
  },
  // Foto real del kit de cuidado que ya usaba la landing (hero, escritorio):
  // muestra exactamente lo que enumera la pagina 8 (atomizador, dos toallas
  // de microfibra y tarjeta con QR). En el PDF esa pagina repite la foto de
  // la cocina.
  kit: {
    src: "/hero-producto.jpg",
    width: 1230,
    height: 1278,
    alt: "Caja del kit Corazza con atomizador aromatizante, dos toallas de microfibra enrolladas y tarjeta con código QR.",
  },
} satisfies Record<string, PortfolioImage>;

// --- Pagina 1: portada -----------------------------------------------------
export const PORTADA = {
  eyebrow: "PORTAFOLIO COMERCIAL",
  title: "Protección premium para superficies.",
  tagline: ["Protect", "Preserve", "Elevate"], // separados por " • " en el PDF
} as const;

// --- Pagina 2 ------------------------------------------------------------------
export const MANIFIESTO = {
  eyebrow: "CORAZZA PRIME SURFACES",
  title: "Protección que respeta el diseño.",
  body: "Una solución creada para proteger superficies de alto valor procurando conservar su apariencia y protagonismo dentro del espacio.",
  // En el PDF: "ARQUITECTÓNICA.  CÁLIDA.  DISCRETA." en una sola linea.
  values: ["ARQUITECTÓNICA.", "CÁLIDA.", "DISCRETA."],
} as const;

// --- Pagina 3 ------------------------------------------------------------------
export const SOLUCION = {
  eyebrow: "LA SOLUCIÓN",
  title: "Una capa de protección casi imperceptible.",
  body: "La lámina Corazza se aplica profesionalmente sobre superficies compatibles para crear una barrera adicional sin convertir la protección en el centro visual.",
} as const;

// --- Pagina 4 ------------------------------------------------------------------
export const SUPERFICIES = {
  eyebrow: "SUPERFICIES",
  title: "Materiales que merecen conservarse.",
  items: ["Mármol", "Granito", "Cuarzo", "Madera", "Porcelanato", "Mobiliario especial"],
} as const;

// --- Pagina 5 ------------------------------------------------------------------
export const APLICACIONES = {
  eyebrow: "APLICACIONES",
  title: "Pensada para vivir donde tú vives.",
  body: "Mesas de comedor, islas, barras, topes de cocina, escritorios y otras superficies protagonistas del espacio.",
} as const;

// --- Pagina 6 ------------------------------------------------------------------
export const BENEFICIOS = {
  eyebrow: "BENEFICIOS",
  title: "Protección sin alterar el lenguaje del espacio.",
  items: [
    { number: "01", title: "Barrera adicional", body: "Frente al uso cotidiano y al contacto directo." },
    { number: "02", title: "Presencia discreta", body: "La superficie continúa siendo protagonista." },
    { number: "03", title: "Cuidado controlado", body: "Una rutina de mantenimiento más simple." },
    { number: "04", title: "Instalación profesional", body: "Preparación, aplicación y terminación cuidadas." },
  ],
} as const;

// --- Pagina 7 (pasos secuenciales) -------------------------------------------
export const SERVICIO = {
  eyebrow: "NUESTRO SERVICIO",
  title: "Una instalación cuidada de principio a fin.",
  steps: [
    { number: "01", title: "Evaluamos", body: "Superficie, medidas y condiciones." },
    { number: "02", title: "Preparamos", body: "Limpieza y acondicionamiento." },
    { number: "03", title: "Instalamos", body: "Aplicación técnica y terminaciones." },
    { number: "04", title: "Entregamos", body: "Revisión y recomendaciones de cuidado." },
  ],
} as const;

// --- Pagina 8 ------------------------------------------------------------------
export const EXPERIENCIA = {
  eyebrow: "EXPERIENCIA CORAZZA",
  title: "El cuidado continúa en casa.",
  body: "Una experiencia de marca pensada para acompañar la superficie después de la instalación.",
  items: ["Atomizador aromatizante", "2 toallas de microfibra", "Tarjeta con QR"],
} as const;

// --- Pagina 9: dos acabados ----------------------------------------------------
// Ajustado a pedido del cliente (no es el texto del PDF): se quitaron
// MATERIAL, ADHESIVO, ESPESOR y ROLLO; ACABADO dice "Brillo super
// transparente" en ambas fichas; "VIDA ÚTIL ESTIMADA" pasa a "VIDA ÚTIL".
export type Finish = {
  id: "high-gloss" | "ultra-matte";
  brand: string;
  name: string;
  subtitle: string;
  specs: readonly { label: string; value: string }[];
  // Foto del tope con la lamina levantada, recortada de las piezas de
  // Instagram del cliente (solo la fotografia, sin el texto ni el logo).
  image: { src: string; width: number; height: number; alt: string };
};

export const TECNOLOGIA = {
  eyebrow: "TECNOLOGÍA DE PROTECCIÓN",
  title: "Dos acabados. Una misma filosofía de protección.",
  finishes: [
    {
      id: "high-gloss",
      brand: "CORAZZA",
      name: "HIGH GLOSS",
      subtitle: "PREMIUM SURFACE PROTECTION FILM",
      specs: [
        { label: "ACABADO", value: "Brillo super transparente" },
        { label: "TOP COATING", value: "Hidrofóbico + autorreparación con calor" },
        { label: "GARANTÍA", value: "5 años" },
        { label: "VIDA ÚTIL", value: "10 años*" },
      ],
      image: {
        src: "/portafolio/acabado-high-gloss.jpg",
        width: 694,
        height: 800,
        alt: "Mano levantando la lámina High Gloss, transparente y brillante, del borde de un tope de mármol",
      },
    },
    {
      id: "ultra-matte",
      brand: "CORAZZA",
      name: "ULTRA MATTE",
      subtitle: "PREMIUM SURFACE PROTECTION FILM",
      specs: [
        { label: "ACABADO", value: "Brillo super transparente" },
        { label: "TOP COATING", value: "Hidrofóbico + autorreparación con calor" },
        { label: "GARANTÍA", value: "7 años" },
        { label: "VIDA ÚTIL", value: "10 años*" },
      ],
      image: {
        src: "/portafolio/acabado-ultra-matte.jpg",
        width: 694,
        height: 800,
        alt: "Mano levantando la lámina Ultra Matte, de acabado mate, del borde de un tope de mármol",
      },
    },
  ] satisfies Finish[],
  footnote:
    "* Vida útil de referencia estimada. El origen de esta estimación no está especificado en la ficha técnica del fabricante y puede variar según uso, mantenimiento, superficie y exposición.",
} as const;
