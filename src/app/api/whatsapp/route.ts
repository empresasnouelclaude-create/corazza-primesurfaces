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
import { MENSAJE_LLAMADA } from "@/lib/asistente/prompt.ts";
import {
  descargarImagen,
  enviarImagen,
  enviarTexto,
  firmaValida,
  leerEstados,
  leerLlamadas,
  leerMensajes,
  marcarLeido,
  verificarSuscripcion,
  type CredencialesWhatsApp,
  type EstadoEnvio,
  type MensajeEntrante,
} from "@/lib/asistente/whatsapp.ts";
import { atiendeAsistente } from "@/lib/panel/remitentes.ts";
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

  const aviso = JSON.parse(cuerpo);
  // Solo se atienden los mensajes del numero principal; los de otros numeros
  // (por ejemplo, el del tecnico) los responde esa persona desde su app.
  const mensajes = leerMensajes(aviso).filter((m) => atiendeAsistente(m.para));
  const llamadas = leerLlamadas(aviso).filter((l) => atiendeAsistente(l.para));
  const estados = leerEstados(aviso);
  const guardado = elegirAlmacen();

  // Se responde 200 enseguida (Meta lo exige) y se atiende despues.
  after(async () => {
    // Estado de los mensajes enviados desde el panel (entregado, leido, fallido).
    if (estados.length) await actualizarEnvios(estados).catch((e) => console.error("Estados de WhatsApp:", e));
    for (const mensaje of mensajes) {
      try {
        // Meta puede reenviar el mismo aviso; se ignoran los ya atendidos.
        if (!(await guardado.marcarAtendido(mensaje.id))) continue;
        await atender(mensaje, cred, ia, guardado);
      } catch (error) {
        console.error("Asistente WhatsApp:", error);
      }
    }
    // Llamadas por WhatsApp: no se atienden; se envia un mensaje.
    for (const llamada of llamadas) {
      try {
        if (!(await guardado.marcarAtendido(`llamada:${llamada.id}`))) continue;
        await enviarTexto(cred, llamada.de, MENSAJE_LLAMADA);
        // Queda en el historial para que el asistente sepa que intento llamar.
        const conv = await guardado.obtener(llamada.de);
        conv.mensajes.push({ role: "user", content: `(Nota del sistema: el cliente intentó llamar por WhatsApp y se le envió: "${MENSAJE_LLAMADA}")` });
        conv.actualizado = new Date().toISOString();
        await guardado.guardar(conv);
      } catch (error) {
        console.error("Asistente WhatsApp (llamada):", error);
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

// Un estado solo reemplaza a uno anterior (enviado -> entregado -> leido);
// "fallido" reemplaza a cualquiera. Meta puede mandarlos desordenados.
const ANTERIORES: Record<EstadoEnvio["estado"], string[]> = {
  enviado: [],
  entregado: ["enviado"],
  leido: ["enviado", "entregado"],
  fallido: ["enviado", "entregado", "leido"],
};

async function actualizarEnvios(estados: EstadoEnvio[]) {
  const db = baseDeDatos();
  if (!db) return;
  for (const e of estados) {
    if (!ANTERIORES[e.estado].length) continue;
    const { error } = await db
      .from("envios_whatsapp")
      .update({ estado: e.estado, error: e.error })
      .eq("wamid", e.wamid)
      .in("estado", ANTERIORES[e.estado]);
    if (error) throw error;
  }
}
