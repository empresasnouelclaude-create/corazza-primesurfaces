// Donde se guardan las conversaciones: en la base de datos (Supabase) en
// produccion, o en memoria para pruebas locales. Las dos tienen la misma
// interfaz, asi que el resto del codigo no cambia.
import type { SupabaseClient } from "@supabase/supabase-js";
import { nuevaConversacion, type Conversacion } from "./tipos.ts";

export interface Almacen {
  obtener(id: string): Promise<Conversacion>;
  guardar(conversacion: Conversacion): Promise<void>;
  /** Marca un mensaje de WhatsApp como atendido. Devuelve false si ya lo estaba. */
  marcarAtendido(mensajeId: string): Promise<boolean>;
}

/**
 * Almacen en memoria. NO sirve en produccion: en Vercel cada instancia tiene
 * su propia memoria y se borra al reiniciar. Solo para pruebas locales.
 */
export class AlmacenMemoria implements Almacen {
  private conversaciones = new Map<string, Conversacion>();

  async obtener(id: string) {
    return this.conversaciones.get(id) ?? nuevaConversacion(id);
  }

  async guardar(conversacion: Conversacion) {
    this.conversaciones.set(conversacion.id, conversacion);
  }

  private atendidos = new Set<string>();

  async marcarAtendido(mensajeId: string) {
    if (this.atendidos.has(mensajeId)) return false;
    this.atendidos.add(mensajeId);
    return true;
  }
}

/** Almacen en la base de datos (Supabase). Es el que se usa en produccion. */
export class AlmacenSupabase implements Almacen {
  private db: SupabaseClient;

  constructor(db: SupabaseClient) {
    this.db = db;
  }

  async obtener(id: string) {
    const { data, error } = await this.db.from("conversaciones").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return nuevaConversacion(id);
    return {
      id: data.id,
      estado: data.estado === "vendedor" ? "vendedor" : "asistente",
      datos: { ...nuevaConversacion(id).datos, ...data.datos },
      mensajes: data.mensajes ?? [],
      pase: data.pase ?? null,
      actualizado: data.actualizado,
    } satisfies Conversacion;
  }

  async guardar(c: Conversacion) {
    const { error } = await this.db.from("conversaciones").upsert({
      id: c.id,
      estado: c.estado,
      datos: c.datos,
      mensajes: c.mensajes,
      pase: c.pase,
      actualizado: c.actualizado,
    });
    if (error) throw error;
  }

  async marcarAtendido(mensajeId: string) {
    const { error } = await this.db.from("mensajes_atendidos").insert({ id: mensajeId });
    if (!error) return true;
    if (error.code === "23505") return false; // ya existia
    throw error;
  }
}
