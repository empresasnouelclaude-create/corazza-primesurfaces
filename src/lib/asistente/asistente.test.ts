// Pruebas del asistente de WhatsApp (sin llamar a la IA real ni a WhatsApp).
// Ejecutar con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import { HERRAMIENTAS, ejecutarHerramienta } from "./herramientas.ts";
import { MENSAJE_BIENVENIDA } from "./prompt.ts";
import { MENSAJE_PASE, parametrosIA, responder, type CrearMensaje, type ParametrosIA } from "./motor.ts";
import { instruccionesAsistente } from "./prompt.ts";
import { nuevaConversacion } from "./tipos.ts";
import { firmaValida, leerMensajes, verificarSuscripcion } from "./whatsapp.ts";

const AHORA = new Date("2026-10-19T12:00:00Z");

// IA simulada: devuelve las respuestas en orden y guarda lo que recibio.
function iaFalsa(respuestas: Partial<Anthropic.Beta.BetaMessage>[]) {
  const llamadas: ParametrosIA[] = [];
  const crear: CrearMensaje = async (params) => {
    llamadas.push(structuredClone(params));
    const r = respuestas.shift();
    if (!r) throw new Error("La IA falsa no tiene más respuestas");
    return r as Anthropic.Beta.BetaMessage;
  };
  return { crear, llamadas };
}

const texto = (t: string) => ({ type: "text", text: t, citations: null }) as Anthropic.Beta.BetaTextBlock;
const usar = (id: string, name: string, input: unknown) =>
  ({ type: "tool_use", id, name, input }) as Anthropic.Beta.BetaToolUseBlock;

test("instrucciones: reglas clave y solo el acabado disponible", () => {
  const p = instruccionesAsistente();
  assert.match(p, /No des precios/);
  assert.match(p, /asistente virtual de Corazza/);
  assert.match(p, /HIGH GLOSS/);
  assert.doesNotMatch(p, /ULTRA MATTE/);
  assert.match(p, /5 años/);
});

test("herramientas: definiciones estrictas y con nombres conocidos", () => {
  assert.deepEqual(
    HERRAMIENTAS.map((h) => h.name),
    ["guardar_datos_cliente", "enviar_guia_medicion", "enviar_fotos_trabajos", "pasar_a_vendedor"],
  );
  for (const h of HERRAMIENTAS) assert.equal(h.strict, true);
});

test("guardar_datos_cliente: guarda lo nuevo, no borra con null e informa lo que falta", () => {
  let conv = nuevaConversacion("18095550142", AHORA);
  conv = ejecutarHerramienta("guardar_datos_cliente", { superficie: "mesa de comedor", material: "cuarzo", medidas: null }, conv).conversacion;
  const r = ejecutarHerramienta("guardar_datos_cliente", { superficie: null, medidas: "240 x 90 cm" }, conv);
  assert.equal(r.conversacion.datos.superficie, "mesa de comedor");
  assert.equal(r.conversacion.datos.medidas, "240 x 90 cm");
  assert.deepEqual(JSON.parse(r.resultado).faltan, ["sector", "fecha_deseada"]);
});

test("pasar_a_vendedor: cambia el estado y genera el aviso", () => {
  const r = ejecutarHerramienta("pasar_a_vendedor", { motivo: "reclamo", resumen: "Burbuja en la lámina" }, nuevaConversacion("1"), AHORA);
  assert.equal(r.conversacion.estado, "vendedor");
  assert.equal(r.conversacion.pase?.motivo, "reclamo");
  assert.equal(r.acciones[0].tipo, "avisar_vendedor");
});

test("motor: ejecuta herramientas, devuelve el texto y conserva el historial", async () => {
  const { crear, llamadas } = iaFalsa([
    { stop_reason: "tool_use", content: [usar("t1", "guardar_datos_cliente", { superficie: "mesa de comedor", material: "cuarzo" })] },
    { stop_reason: "end_turn", content: [texto("¡Qué bien! ¿Me compartes las medidas aproximadas?")] },
  ]);
  const r = await responder({
    conversacion: nuevaConversacion("18095550142", AHORA),
    entrada: { texto: "Hola, tengo una mesa de comedor de cuarzo", nombrePerfil: "Patricia" },
    crear,
    ahora: AHORA,
  });
  assert.deepEqual(r.respuestas, ["¡Qué bien! ¿Me compartes las medidas aproximadas?"]);
  assert.equal(r.conversacion.datos.superficie, "mesa de comedor");
  assert.equal(r.conversacion.datos.nombre, "Patricia");
  // usuario, asistente (herramienta), resultado, asistente (texto)
  assert.equal(r.conversacion.mensajes.length, 4);
  assert.equal(llamadas.length, 2);
  assert.equal(llamadas[0].model, "claude-haiku-5-5");
  assert.equal(llamadas[0].fallbacks, undefined); // Haiku no tiene respaldo
  assert.equal(llamadas[0].output_config?.effort, "low");
});

test("parametros: con Sonnet u Opus se pide el modelo de respaldo", () => {
  const p = parametrosIA(nuevaConversacion("1"), "claude-sonnet-5-5");
  assert.equal(p.fallbacks, "default");
  assert.deepEqual(p.betas, ["server-side-fallback-2026-07-01"]);
});

test("motor: con la conversacion en manos del vendedor, guarda el mensaje pero no llama a la IA", async () => {
  const conv = { ...nuevaConversacion("1"), estado: "vendedor" as const };
  const { crear, llamadas } = iaFalsa([]);
  const r = await responder({ conversacion: conv, entrada: { texto: "¿Ya me cotizaron?" }, crear });
  assert.equal(llamadas.length, 0);
  assert.equal(r.respuestas.length, 0);
  assert.equal(r.conversacion.mensajes.length, 1);
});

test("motor: si la IA declina, pasa al vendedor con un mensaje amable", async () => {
  const { crear } = iaFalsa([{ stop_reason: "refusal", content: [] }]);
  const r = await responder({ conversacion: nuevaConversacion("1"), entrada: { texto: "..." }, crear, ahora: AHORA });
  assert.deepEqual(r.respuestas, [MENSAJE_PASE]);
  assert.equal(r.conversacion.estado, "vendedor");
});

test("motor: las fotos pedidas salen como accion", async () => {
  const { crear } = iaFalsa([
    { stop_reason: "tool_use", content: [texto("Te comparto cómo se ve:"), usar("t1", "enviar_fotos_trabajos", { tipo: "acabado" })] },
    { stop_reason: "end_turn", content: [texto("¿Qué te parece?")] },
  ]);
  const r = await responder({ conversacion: nuevaConversacion("1"), entrada: { texto: "¿Cómo se ve?" }, crear });
  assert.deepEqual(r.respuestas, ["Te comparto cómo se ve:", "¿Qué te parece?"]);
  const fotos = r.acciones.find((a) => a.tipo === "enviar_fotos");
  assert.ok(fotos && fotos.tipo === "enviar_fotos" && fotos.fotos[0].url.endsWith(".jpg"));
});

test("whatsapp: verificacion del webhook", () => {
  const ok = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "abc", "hub.challenge": "123" });
  assert.equal(verificarSuscripcion(ok, "abc"), "123");
  assert.equal(verificarSuscripcion(ok, "otro"), null);
  assert.equal(verificarSuscripcion(ok, undefined), null);
});

test("whatsapp: firma de Meta", () => {
  const cuerpo = '{"entry":[]}';
  const firma = "sha256=" + createHmac("sha256", "secreto").update(cuerpo).digest("hex");
  assert.equal(firmaValida(cuerpo, firma, "secreto"), true);
  assert.equal(firmaValida(cuerpo + " ", firma, "secreto"), false);
  assert.equal(firmaValida(cuerpo, firma, undefined), false);
  assert.equal(firmaValida(cuerpo, null, "secreto"), false);
});

test("whatsapp: lee texto e imagen con el nombre del perfil e ignora estados", () => {
  const aviso = {
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ wa_id: "18095550142", profile: { name: "Patricia" } }],
              messages: [
                { id: "m1", from: "18095550142", type: "text", text: { body: "Hola" } },
                { id: "m2", from: "18095550142", type: "image", image: { id: "media1", caption: "Mi mesa" } },
              ],
            },
          },
          { value: { statuses: [{ id: "x" }] } },
        ],
      },
    ],
  };
  const m = leerMensajes(aviso);
  assert.equal(m.length, 2);
  assert.deepEqual(m[0], { id: "m1", de: "18095550142", nombrePerfil: "Patricia", tipo: "texto", texto: "Hola", mediaId: null });
  assert.equal(m[1].mediaId, "media1");
  assert.equal(m[1].texto, "Mi mesa");
});

test("almacen en memoria: no atiende dos veces el mismo mensaje", async () => {
  const { AlmacenMemoria } = await import("./almacen.ts");
  const a = new AlmacenMemoria();
  assert.equal(await a.marcarAtendido("wamid.1"), true);
  assert.equal(await a.marcarAtendido("wamid.1"), false);
});

test("motor: la bienvenida fija sale solo en el primer mensaje", async () => {
  const { responder } = await import("./motor.ts");
  const { nuevaConversacion } = await import("./tipos.ts");
  const texto = (t: string) => ({ stop_reason: "end_turn" as const, content: [{ type: "text" as const, text: t, citations: null }] });
  const { crear, llamadas } = iaFalsa([texto("¿Me envías una foto?")]);
  const r1 = await responder({ conversacion: nuevaConversacion("1809"), entrada: { texto: "Hola" }, crear });
  assert.deepEqual(r1.respuestas, [MENSAJE_BIENVENIDA], "si solo saluda, basta con la bienvenida");
  assert.equal(llamadas.length, 0);
  const r2 = await responder({ conversacion: r1.conversacion, entrada: { texto: "Mi mesa de comedor" }, crear });
  assert.deepEqual(r2.respuestas, ["¿Me envías una foto?"]);
});

test("solo saludo: reconoce saludos y palabras clave, no preguntas reales", async () => {
  const { esSoloSaludo } = await import("./motor.ts");
  for (const t of ["Hola", "Buenas tardes!", "INFO", "PRECIO", "Hola, buenos días. Info por favor", "Holaa 👋"]) {
    assert.equal(esSoloSaludo({ texto: t }), true, t);
  }
  for (const t of ["¿Cómo se ve?", "Hola, tengo una mesa de mármol", "Mi nombre es Ana", "...", ""]) {
    assert.equal(esSoloSaludo({ texto: t }), false, t);
  }
});

test("motor: si el primer mensaje trae una pregunta, no va la bienvenida fija y la IA recibe la nota", async () => {
  const { responder } = await import("./motor.ts");
  const { nuevaConversacion } = await import("./tipos.ts");
  const { NOTA_PRIMER_MENSAJE } = await import("./prompt.ts");
  const { crear, llamadas } = iaFalsa([{ stop_reason: "end_turn", content: [{ type: "text", text: "Hola, soy el asistente…", citations: null }] }]);
  const r = await responder({ conversacion: nuevaConversacion("1"), entrada: { texto: "Quiero saber cómo funciona" }, crear });
  assert.deepEqual(r.respuestas, ["Hola, soy el asistente…"]);
  assert.match(JSON.stringify(llamadas[0].messages[0].content), /Nota del sistema/);
  assert.ok(JSON.stringify(llamadas[0].messages).includes(NOTA_PRIMER_MENSAJE.slice(0, 20)));
});
