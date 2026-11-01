// Horario laboral de Corazza. El asistente de WhatsApp SOLO responde fuera
// de este horario; dentro de el, responde la persona de ventas desde la app
// WhatsApp Business (mismo numero, modo coexistencia) y el asistente solo
// guarda los mensajes.
//
// TODO(dueño): confirmar el horario real. Para cambiarlo, editar HORARIO.
// Hora de Republica Dominicana (UTC-4, sin horario de verano).

/** Dia de la semana (0 = domingo … 6 = sábado) -> tramos [inicio, fin) en "HH:MM". */
export const HORARIO: Record<number, [string, string][]> = {
  1: [["08:30", "17:30"]], // lunes
  2: [["08:30", "17:30"]],
  3: [["08:30", "17:30"]],
  4: [["08:30", "17:30"]],
  5: [["08:30", "17:30"]], // viernes
  6: [["09:00", "13:00"]], // sábado
  // domingo: sin horario (atiende el asistente todo el día)
};

const ZONA = "America/Santo_Domingo";
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function horaLocal(fecha: Date): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: ZONA, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(fecha);
  const valor = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(valor("weekday"));
  return { dia, minutos: Number(valor("hour")) * 60 + Number(valor("minute")) };
}

const aMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** true si en ese momento atiende el equipo de ventas (el asistente no responde). */
export function enHorarioLaboral(fecha = new Date(), horario = HORARIO): boolean {
  const { dia, minutos } = horaLocal(fecha);
  return (horario[dia] ?? []).some(([a, b]) => minutos >= aMinutos(a) && minutos < aMinutos(b));
}

/** El horario en texto, para las instrucciones del asistente. */
export function textoHorario(horario = HORARIO): string {
  return [1, 2, 3, 4, 5, 6, 0]
    .map((d) => `${DIAS[d]}: ${(horario[d] ?? []).map(([a, b]) => `${a} a ${b}`).join(" y ") || "cerrado"}`)
    .join("; ");
}
