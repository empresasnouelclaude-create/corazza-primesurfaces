// ============================================================================
// CONFIGURACION EDITABLE DE CORAZZA -- PUNTO UNICO DE VERDAD PARA TODOS LOS
// ENLACES Y TEXTOS QUE CAMBIAN CON EL TIEMPO.
//
// Todo lo que un dueño de negocio necesita tocar (numero de WhatsApp, redes
// sociales, superficies que se atienden) vive en este archivo -- ningun
// componente de src/app/components/ escribe un enlace "a mano". Asi, para
// publicar la pagina de verdad, alcanza con editar los valores de aca abajo.
// ============================================================================

// --- WhatsApp -----------------------------------------------------------
export const WHATSAPP_PHONE = "18098760493";

const WHATSAPP_MESSAGES = {
  cotizar: "Hola, quiero cotizar la proteccion de una superficie.",
  cuidados: "Hola, quiero recibir orientacion sobre cuidados y garantia de mi superficie.",
} as const;

function buildWhatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_LINKS = {
  cotizar: buildWhatsappLink(WHATSAPP_MESSAGES.cotizar),
  cuidados: buildWhatsappLink(WHATSAPP_MESSAGES.cuidados),
};

// --- Redes sociales -------------------------------------------------------
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/corazza.do",
  tiktok: "https://www.tiktok.com/@corazza.do",
};

// --- Superficies que se protegen ------------------------------------------
// TODO(cliente): confirma cuales de estas superficies atiende Corazza antes
// de publicar, y ajusta la descripcion de cada una si hace falta. La lista
// es intencionalmente generica (no promete un tratamiento especifico por
// material) hasta que el negocio confirme su alcance real.
export const SURFACES = [
  {
    name: "Mármol",
    description: "Sellado y mantenimiento para preservar su brillo natural.",
  },
  {
    name: "Granito",
    description: "Protección contra manchas, calor y desgaste diario.",
  },
  {
    name: "Cuarzo",
    description: "Cuidado especializado para superficies de alto tránsito.",
  },
  {
    name: "Porcelanato",
    description: "Tratamientos que conservan su acabado original.",
  },
  {
    name: "Madera",
    description: "Protección natural para superficies y mobiliario en madera.",
  },
  {
    name: "Otras superficies",
    description: "Cuéntanos tu caso y te decimos si podemos ayudarte.",
  },
] as const;

// --- Galeria antes / despues -----------------------------------------------
// TODO(cliente): reemplaza estos espacios por fotos reales de proyectos
// (formato recomendado 4:3, mismo encuadre en "antes" y "despues"). Mientras
// tanto se muestran como placeholders visuales, claramente identificados.
export const GALLERY_PLACEHOLDERS = [
  { id: "proyecto-1", label: "Encimera de cocina" },
  { id: "proyecto-2", label: "Piso de mármol" },
  { id: "proyecto-3", label: "Mesón de baño" },
  { id: "proyecto-4", label: "Superficie exterior" },
] as const;

// --- Pasos de "Como funciona" ----------------------------------------------
export const HOW_IT_WORKS_STEPS = [
  {
    title: "Cuéntanos sobre tu superficie",
    description: "Escríbenos por WhatsApp con fotos y el tipo de material.",
  },
  {
    title: "Recibe tu recomendación",
    description: "Evaluamos su estado y te proponemos el tratamiento adecuado.",
  },
  {
    title: "Protege y conserva",
    description: "Aplicamos el servicio y tu superficie luce como nueva, por más tiempo.",
  },
] as const;

// --- Dominio ----------------------------------------------------------------
// TODO(cliente): cuando el dominio propio este conectado en Vercel (Settings
// -> Domains), reemplaza este valor por el dominio real. Se usa solo para
// metadataBase en layout.tsx (URLs absolutas de Open Graph/canonical). Este
// proyecto es independiente -- no necesita ningun archivo de proxy/middleware
// para que el dominio funcione, a diferencia de una app dentro de otra
// plataforma: Vercel sirve la "/" de este proyecto directo en ese dominio.
export const CORAZZA_DOMAIN = "corazzaprimesurfaces.com";
