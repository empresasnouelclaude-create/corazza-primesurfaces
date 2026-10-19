// Donde se guardan las conversaciones. Por ahora solo existe la version en
// memoria (sirve para pruebas); cuando exista la base de datos del panel se
// agrega aqui su implementacion con la misma interfaz y el resto del codigo
// no cambia.
import { nuevaConversacion, type Conversacion } from "./tipos.ts";

export interface Almacen {
  obtener(id: string): Promise<Conversacion>;
  guardar(conversacion: Conversacion): Promise<void>;
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
}
