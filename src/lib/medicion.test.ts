import { test } from "node:test";
import assert from "node:assert/strict";
import { enlaceConReferencia, referenciaDesde } from "./medicion.ts";

test("referencia: prioriza utm_content, luego campaign y source", () => {
  assert.equal(referenciaDesde("?utm_source=ig&utm_campaign=lanzamiento&utm_content=cafe"), "cafe");
  assert.equal(referenciaDesde("?utm_source=ig&utm_campaign=lanzamiento"), "lanzamiento");
  assert.equal(referenciaDesde("?utm_source=google"), "google");
  assert.equal(referenciaDesde(""), null);
});

test("enlace de WhatsApp: agrega la referencia una sola vez", () => {
  const base = "https://wa.me/18492604759?text=" + encodeURIComponent("Hola, quiero cotizar.");
  const con = enlaceConReferencia(base, "cafe");
  assert.equal(new URL(con).searchParams.get("text"), "Hola, quiero cotizar. (ref: cafe)");
  assert.equal(enlaceConReferencia(con, "otro"), con);
});
