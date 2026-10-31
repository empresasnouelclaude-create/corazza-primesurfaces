// Datos que el panel saca de los PDF de Citrus ERP (cotizaciones, facturas,
// reportes de cuentas por cobrar e inventario). Corazza cotiza y factura en
// Citrus; el panel solo lee esos documentos para mostrar todo en un lugar.

export type TipoDocumento =
  | "cotizacion"
  | "factura"
  | "nota_credito"
  | "recibo_pago"
  | "otro";

export type EstadoPago = "pendiente" | "parcial" | "pagada" | "vencida" | "desconocido";

export type LineaDocumento = {
  descripcion: string;
  cantidad: number | null;
  unidad: string | null;
  precio_unitario: number | null;
  total: number | null;
};

export type DocumentoCitrus = {
  tipo: TipoDocumento;
  /** Numero del documento en Citrus (cotizacion o factura). */
  numero: string | null;
  /** Comprobante fiscal, si aparece. */
  ncf: string | null;
  /** Fechas en formato AAAA-MM-DD. */
  fecha: string | null;
  vencimiento: string | null;
  cliente: { nombre: string | null; rnc: string | null; telefono: string | null };
  lineas: LineaDocumento[];
  subtotal: number | null;
  descuento: number | null;
  itbis: number | null;
  total: number | null;
  pagado: number | null;
  saldo: number | null;
  moneda: string | null;
  estado: EstadoPago;
  notas: string | null;
};

export type ProductoInventario = {
  producto: string;
  codigo: string | null;
  cantidad: number | null;
  unidad: string | null;
  costo: number | null;
};

/** Lo que devuelve la lectura de un PDF. */
export type LecturaPDF = {
  documentos: DocumentoCitrus[];
  inventario: ProductoInventario[];
  /** Avisos de la lectura: datos ilegibles, montos que no cuadran, etc. */
  advertencias: string[];
};

/** Documento ya guardado en el panel, con de donde salio. */
export type DocumentoGuardado = DocumentoCitrus & {
  id: string;
  archivo: string;
  subido: string;
  /** Donde quedo guardado el PDF en la base de datos (si esta conectada). */
  pdf?: string | null;
};
