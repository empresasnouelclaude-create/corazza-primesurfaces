// Calculos del panel a partir de los documentos de Citrus: unir lecturas
// nuevas con las anteriores y sacar los totales. Funciones puras.
import type { DocumentoCitrus, DocumentoGuardado } from "./tipos.ts";

/** Clave para reconocer el mismo documento en distintos PDF. */
export function claveDocumento(d: Pick<DocumentoCitrus, "tipo" | "numero" | "ncf">): string | null {
  const id = d.numero?.trim() || d.ncf?.trim();
  return id ? `${d.tipo}:${id.toUpperCase()}` : null;
}

/**
 * Agrega documentos nuevos. Si un documento ya existia (mismo tipo y numero),
 * se actualiza con los datos nuevos que no esten vacios: por ejemplo, el
 * reporte diario de cuentas por cobrar actualiza el saldo de una factura.
 */
export function unirDocumentos(actuales: DocumentoGuardado[], nuevos: DocumentoGuardado[]): DocumentoGuardado[] {
  const resultado = [...actuales];
  for (const nuevo of nuevos) {
    const clave = claveDocumento(nuevo);
    const i = clave ? resultado.findIndex((d) => claveDocumento(d) === clave) : -1;
    if (i === -1) {
      resultado.push(nuevo);
      continue;
    }
    const previo = resultado[i];
    const combinado = { ...previo } as Record<string, unknown>;
    for (const [campo, valor] of Object.entries(nuevo)) {
      // Se conserva de que PDF salio el documento la primera vez.
      if (campo === "id" || campo === "archivo" || campo === "subido" || campo === "pdf") continue;
      if (campo === "lineas" && Array.isArray(valor) && valor.length === 0) continue;
      if (campo === "estado" && valor === "desconocido") continue;
      if (valor !== null && valor !== undefined) combinado[campo] = valor;
    }
    combinado.cliente = {
      nombre: nuevo.cliente.nombre ?? previo.cliente.nombre,
      rnc: nuevo.cliente.rnc ?? previo.cliente.rnc,
      telefono: nuevo.cliente.telefono ?? previo.cliente.telefono,
    };
    resultado[i] = combinado as DocumentoGuardado;
  }
  return resultado;
}

const suma = (valores: (number | null)[]) => valores.reduce<number>((t, v) => t + (v ?? 0), 0);

export type Resumen = {
  cotizado: number;
  cotizaciones: number;
  facturado: number;
  facturas: number;
  porCobrar: number;
  cobrado: number;
  /** Clientes con saldo pendiente, de mayor a menor. */
  deudores: { cliente: string; saldo: number; facturas: number }[];
};

/** Saldo de una factura: el que trae el PDF, o total menos pagado. */
export function saldoDe(d: DocumentoCitrus): number {
  if (d.saldo !== null) return d.saldo;
  if (d.estado === "pagada") return 0;
  if (d.total !== null) return d.total - (d.pagado ?? 0);
  return 0;
}

export function resumen(documentos: DocumentoCitrus[], desde?: string, hasta?: string): Resumen {
  const enRango = (d: DocumentoCitrus) =>
    (!desde || (d.fecha ?? "") >= desde) && (!hasta || (d.fecha ?? "9999") <= hasta);
  const cotizaciones = documentos.filter((d) => d.tipo === "cotizacion" && enRango(d));
  const facturas = documentos.filter((d) => d.tipo === "factura" && enRango(d));
  // Lo pendiente de cobro no depende del periodo: es lo que se debe hoy.
  const todasFacturas = documentos.filter((d) => d.tipo === "factura");

  const porCliente = new Map<string, { saldo: number; facturas: number }>();
  for (const f of todasFacturas) {
    const saldo = saldoDe(f);
    if (saldo <= 0) continue;
    const nombre = f.cliente.nombre ?? "Sin nombre";
    const actual = porCliente.get(nombre) ?? { saldo: 0, facturas: 0 };
    porCliente.set(nombre, { saldo: actual.saldo + saldo, facturas: actual.facturas + 1 });
  }

  const facturado = suma(facturas.map((f) => f.total));
  const porCobrar = suma(todasFacturas.map(saldoDe));
  return {
    cotizado: suma(cotizaciones.map((c) => c.total)),
    cotizaciones: cotizaciones.length,
    facturado,
    facturas: facturas.length,
    porCobrar,
    cobrado: suma(facturas.map((f) => f.total)) - suma(facturas.map(saldoDe)),
    deudores: [...porCliente.entries()]
      .map(([cliente, v]) => ({ cliente, ...v }))
      .sort((a, b) => b.saldo - a.saldo),
  };
}
