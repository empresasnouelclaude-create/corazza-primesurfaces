// ============================================================================
// CONOCIMIENTO DEL ASISTENTE DE WHATSAPP DE CORAZZA
//
// Todo lo que el asistente "sabe" del negocio. Los datos del producto se
// toman del mismo contenido de la web (portafolio.ts), asi la web y el
// asistente nunca se contradicen. Lo marcado TODO(dueño) esta pendiente de
// que los dueños lo confirmen; mientras tanto el asistente NO lo afirma y
// pasa la pregunta al equipo.
// ============================================================================

import {
  BENEFICIOS,
  EXPERIENCIA,
  SERVICIO,
  SOLUCION,
  SUPERFICIES,
  VISIBLE_FINISHES,
} from "../../app/portafolio.ts";

export const SITIO = "https://www.corazza.com.do";

/** Enlace a la guia "¿Cómo medir mi tope?" de la web. */
export const GUIA_MEDICION_URL = `${SITIO}/#como-medir`;

// Imagenes que el asistente puede enviar (URLs publicas de la web). WhatsApp
// solo acepta JPG o PNG como imagen, por eso no se usan las .webp.
// Son imagenes de referencia de la marca, no instalaciones de clientes: los
// pies no dicen lo contrario.
// TODO(dueño): agregar fotos reales de instalaciones (JPG) cuando existan.
export const FOTOS_TRABAJOS = {
  acabado: [{ url: `${SITIO}/portafolio/acabado-high-gloss.jpg`, pie: "Lámina Corazza High Gloss: brillo super transparente" }],
  kit: [{ url: `${SITIO}/hero-producto.jpg`, pie: "Kit de cuidado que recibe cada cliente" }],
} as const;

export type TipoFotos = keyof typeof FOTOS_TRABAJOS;

/** Ficha del producto disponible, en texto, a partir de la web. */
function fichaProducto(): string {
  return VISIBLE_FINISHES.map(
    (f) => `- ${f.brand} ${f.name}: ${f.specs.map((s) => `${s.label.toLowerCase()}: ${s.value}`).join("; ")}.`,
  ).join("\n");
}

/** Bloque de conocimiento que se incluye en las instrucciones del asistente. */
export function conocimientoCorazza(): string {
  return `QUÉ ES CORAZZA
Corazza Prime protege superficies de alto valor con una lámina transparente que se aplica profesionalmente. Así la superficie tiene un acabado brillante, pero también una barrera extra frente al uso diario.
Cuando expliques qué es o cómo funciona, usa esa misma idea y esas palabras.
${SOLUCION.body}
Lema: Protect · Preserve · Elevate.

PRODUCTO DISPONIBLE
${fichaProducto()}
* La vida útil es una referencia estimada; puede variar según el uso, el mantenimiento, la superficie y la exposición.
Por ahora solo hay un acabado disponible (High Gloss). Si preguntan por un acabado mate, di que por el momento el disponible es el brillante y que el equipo le avisa si eso cambia.

MATERIALES QUE SE PROTEGEN
${SUPERFICIES.items.filter((m) => m !== "Madera").join(", ")}.
MADERA: por ahora no se trabaja. Si el cliente pregunta por madera o dice que su superficie es de madera, respóndele: "Por el momento no estamos trabajando madera, pero próximamente lo tendremos disponible." Luego sigue la regla ALGO QUE NO OFRECEMOS.

DÓNDE SE USA (por ahora)
Mesas de comedor, mesas de centro, mesas auxiliares, repisas y recibidores en superficies de piedra.
Por ahora Corazza no ofrece cocinas, topes de cocina ni islas: no los ofrezcas ni los pongas de ejemplo. Si un cliente pregunta por eso, sigue la regla ALGO QUE NO OFRECEMOS.

BENEFICIOS
${BENEFICIOS.items.map((b) => `- ${b.title}: ${b.body}`).join("\n")}

CÓMO ES EL SERVICIO
${SERVICIO.steps.map((s) => `${s.number}. ${s.title}: ${s.body}`).join("\n")}

DESPUÉS DE LA INSTALACIÓN
Cada cliente recibe el kit de cuidado: ${EXPERIENCIA.items.join(", ").toLowerCase()}. La tarjeta QR sirve para registrar la garantía.

CÓMO MEDIR
La web tiene una guía con dibujos para medir superficies rectangulares (largo y ancho) y redondas (diámetro): ${GUIA_MEDICION_URL}
Para cotizar basta con medidas aproximadas; si hace falta, el equipo hace una visita de medición.

CÓMO SE TRABAJA (decisiones de la reunión de experiencia del cliente)
- Cotización: el vendedor la envía el mismo día, en horario laboral. Si escriben fuera de horario, el caso queda listo y el equipo responde a primera hora.
- Visita de medición: solo cuando las medidas o las fotos no alcanzan para cotizar. No tiene costo si la persona compra.
- Pago: 50% de inicial para agendar la instalación y 50% al terminar.
- Agenda: la fecha depende de la disponibilidad del instalador y el vendedor la confirma en la misma conversación.

DESCUENTOS (puedes mencionarlos, pero no calcules montos: el vendedor los aplica en la cotización)
- Lanzamiento: 10% en la primera compra, solo durante el lanzamiento y por tiempo limitado.  TODO(dueño): fecha de cierre.
- Segunda compra: 5% de descuento, válido hasta 6 meses después de la instalación.
- Referidos: el amigo referido recibe 10% y quien lo refiere recibe 5% en su próxima compra.

GIVEAWAY CON JOSHLUX
Si alguien escribe por el sorteo o porque comentó CORAZZA, agradécele que participe y explícale que la participación es en Instagram (seguir las cuentas y comentar CORAZZA en la publicación del sorteo). No confirmes que ya está participando ni quién gana: eso lo anuncia Corazza. Ofrécele una sola vez cotizar sin compromiso si quiere proteger alguna superficie, sin insistir.

PENDIENTE DE CONFIRMAR CON CORAZZA (no lo afirmes; dile al cliente que el equipo se lo confirma)
- Precios y rangos de precio.  TODO(dueño)
- Zonas donde se instala y costo de traslado.  TODO(dueño)
- Tiempo que dura la instalación.  TODO(dueño)
- Horario de atención exacto del equipo.  TODO(dueño)
- Premio y fecha del sorteo.  TODO(dueño)`;
}
