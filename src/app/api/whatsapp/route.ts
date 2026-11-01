// Webhook de WhatsApp: corazza.com.do/api/whatsapp
// GET: verificacion de Meta al configurar el webhook.
// POST: mensajes de clientes -> asistente -> respuestas por WhatsApp.
//
// No hace nada hasta que existan las variables de entorno (ver README,
// "Asistente de WhatsApp"). Las conversaciones se guardan en la base de datos
// (Supabase); sin ella se usa memoria, que solo sirve para pruebas.
import { after } from "next/server";
import { AlmacenMemoria, AlmacenSupabase, type Almacen } from "@/lib/asistente/almacen.ts";
import { configuracionIA } from "@/lib/asistente/ia.ts";
import { enHorarioLaboral } from "@/lib/asistente/horario.ts";
import { responder } from "@/lib/asistente/motor.ts";
import {
  descargarImagen,
  enviarImagen,
  enviarTexto,
  firmaValida,
  leerMensajes,
  marcarLeido,
  verificarSuscripcion,
  type CredencialesWhatsApp,
  type MensajeEntrante,
} from "@/lib/asistente/whatsapp.ts";
import { baseDeDatos } from "@/lib/supabase.ts";

const memoria = new AlmacenMemoria();

function elegirAlmacen(): Almacen {
  const db = baseDeDatos();
  return db ? new AlmacenSupabase(db) : memoria;
}

function credenciales(): CredencialesWhatsApp | null {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

export async function GET(request: Request) {
  const reto = verificarSuscripcion(new URL(request.url).searchParams, process.env.WHATSAPP_VERIFY_TOKEN);
  return reto ? new Response(reto, { status: 200 }) : new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const cuerpo = await request.text();
  if (!firmaValida(cuerpo, request.headers.get("x-hub-signature-256"), process.env.WHATSAPP_APP_SECRET)) {
    return new Response("Forbidden", { status: 403 });
  }
  const cred = credenciales();
  const ia = configuracionIA();
  if (!cred || !ia) return new Response("Asistente sin configurar", { status: 503 });

  const mensajes = leerMensajes(JSON.parse(cuerpo));
  const guardado = elegirAlmacen();

  // Se responde 200 enseguida (Meta lo exige) y se atiende despues.
  after(async () => {
    for (const mensaje of mensajes) {
      try {
        // Meta puede reenviar el mismo aviso; se ignoran los ya atendidos.
        if (!(await guardado.marcarAtendido(mensaje.id))) continue;
        await atender(mensaje, cred, ia, guardado);
      } catch (error) {
        console.error("Asistente WhatsApp:", error);
      }
    }
  });
  return new Response("OK", { status: 200 });
}

async function atender(
  mensaje: MensajeEntrante,
  cred: CredencialesWhatsApp,
  ia: NonNullable<ReturnType<typeof configuracionIA>>,
  almacen: Almacen,
) {
  // En horario laboral responde la persona de ventas desde la app (mismo
  // numero): el asistente solo guarda el mensaje y no lo marca como leido.
  const soloGuardar = enHorarioLaboral();
  if (!soloGuardar) await marcarLeido(cred, mensaje.id).catch(() => {});
  const conversacion = await almacen.obtener(mensaje.de);

  if (mensaje.tipo === "otro") {
    if (conversacion.estado === "asistente" && !soloGuardar) {
      await enviarTexto(cred, mensaje.de, "Por ahora puedo leer mensajes de texto y fotos. ¿Me lo escribes, por favor?");
    }
    return;
  }

  const imagen = mensaje.mediaId ? await descargarImagen(cred, mensaje.mediaId) : null;
  const { conversacion: actualizada, respuestas, acciones } = await responder({
    conversacion,
    entrada: { texto: mensaje.texto, imagen, nombrePerfil: mensaje.nombrePerfil },
    crear: ia.crear,
    modelo: ia.modelo,
    soloGuardar,
  });
  await almacen.guardar(actualizada);

  for (const texto of respuestas) await enviarTexto(cred, mensaje.de, texto);
  for (const accion of acciones) {
    if (accion.tipo === "enviar_fotos") {
      for (const foto of accion.fotos) await enviarImagen(cred, mensaje.de, foto.url, foto.pie);
    }
    if (accion.tipo === "avisar_vendedor") {
      // PENDIENTE: aviso al vendedor (correo o WhatsApp) cuando exista el panel.
      console.info("Caso para el vendedor:", mensaje.de, accion.motivo, accion.resumen);
    }
  }
}
