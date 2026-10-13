import Image from "next/image";
import { SHAPES, TEXT, UNITS } from "./config.ts";
import { SHAPE_DIMENSIONS, format2, formatDimension, formatRD, ft2ToM2 } from "./formulas.ts";
import type { Item, Report } from "./state.ts";

export function shapeLabel(shape: Item["shape"]): string {
  return SHAPES.find((s) => s.id === shape)?.label ?? shape;
}

/** Medidas originales con su unidad, p. ej. "183 × 100 cm" o "Ø 60 cm". */
export function itemMeasures(item: Item): string {
  const unit = UNITS.find((u) => u.id === item.unit)?.short ?? item.unit;
  const values = SHAPE_DIMENSIONS[item.shape].map((d) => formatDimension(item.dims[d] ?? 0));
  if (item.shape === "circular") return `Ø ${values[0]} ${unit}`;
  if (item.shape === "cuadrada") return `${values[0]} × ${values[0]} ${unit}`;
  return `${values.join(" × ")} ${unit}`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("es-DO", { dateStyle: "long", timeStyle: "short" });

// Reporte visual en pantalla (seccion 8): no es un PDF ni promete descarga.
export default function Reporte({ report }: { report: Report }) {
  return (
    <article aria-labelledby="reporte-titulo" className="overflow-hidden rounded-2xl border border-corazza-charcoal/15 bg-corazza-white">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-corazza-charcoal px-5 py-5 sm:px-8">
        <Image src="/corazza-logo-cream.png" alt="Corazza Prime Surfaces" width={720} height={310} className="h-auto w-28 sm:w-32" />
        <h2 id="reporte-titulo" className="font-corazza-serif text-2xl font-medium text-corazza-white sm:text-3xl">
          {TEXT.reportTitle}
        </h2>
      </header>

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-corazza-sans text-xs font-semibold tracking-[0.12em] text-corazza-taupe">{TEXT.reportClient}</dt>
            <dd className="mt-1 font-corazza-sans text-lg font-semibold text-corazza-charcoal">{report.client || TEXT.reportNoClient}</dd>
          </div>
          <div className="sm:text-right">
            <dt className="font-corazza-sans text-xs font-semibold tracking-[0.12em] text-corazza-taupe">{TEXT.reportDate}</dt>
            <dd className="mt-1 font-corazza-sans text-base text-corazza-charcoal">{DATE_FORMAT.format(report.date)}</dd>
          </div>
        </dl>

        {/* Movil: lista apilada (sin desplazamiento lateral). Desde sm: tabla. */}
        <ol className="mt-6 divide-y divide-corazza-charcoal/10 border-y border-corazza-charcoal/10 font-corazza-sans text-sm text-corazza-charcoal sm:hidden">
          {report.items.map((item, i) => (
            <li key={item.id} className="flex items-start gap-3 py-3">
              <span className="w-5 flex-shrink-0 tabular-nums text-corazza-taupe">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.description}</p>
                <p className="mt-0.5 text-[13px] text-corazza-charcoal/80">
                  {shapeLabel(item.shape)} · {itemMeasures(item)}
                </p>
              </div>
              <p className="flex-shrink-0 font-semibold tabular-nums">{format2(item.areaFt2)} ft²</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 hidden sm:block">
          <table className="w-full border-collapse font-corazza-sans text-sm text-corazza-charcoal">
            <thead>
              <tr className="border-b border-corazza-charcoal/20 text-left text-xs font-semibold tracking-[0.08em] text-corazza-taupe">
                <th scope="col" className="w-10 py-3 pr-2">#</th>
                <th scope="col" className="py-3 pr-3">{TEXT.reportSurface}</th>
                <th scope="col" className="py-3 pr-3">{TEXT.reportShape}</th>
                <th scope="col" className="py-3 pr-3">{TEXT.reportMeasures}</th>
                <th scope="col" className="py-3 text-right">{TEXT.reportArea}</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item, i) => (
                <tr key={item.id} className="border-b border-corazza-charcoal/10">
                  <td className="py-3 pr-2 tabular-nums text-corazza-taupe">{i + 1}</td>
                  <td className="py-3 pr-3 font-semibold">{item.description}</td>
                  <td className="py-3 pr-3">{shapeLabel(item.shape)}</td>
                  <td className="py-3 pr-3 tabular-nums">{itemMeasures(item)}</td>
                  <td className="py-3 text-right tabular-nums">{format2(item.areaFt2)} ft²</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-6 max-w-sm divide-y divide-corazza-charcoal/10 font-corazza-sans text-sm text-corazza-charcoal">
          <div className="flex justify-between gap-4 py-2.5">
            <dt>{TEXT.totalArea}</dt>
            <dd className="font-semibold tabular-nums">{format2(report.totalFt2)} ft²</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>{TEXT.totalArea} (m²)</dt>
            <dd className="tabular-nums">{format2(ft2ToM2(report.totalFt2))} m²</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>{TEXT.margin}</dt>
            <dd className="tabular-nums">{report.margin}%</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>{TEXT.film}</dt>
            <dd className="font-semibold tabular-nums">{format2(report.filmFt2)} ft²</dd>
          </div>
          {report.pricePerFt2 !== null && report.quote !== null && (
            <>
              <div className="flex justify-between gap-4 py-2.5">
                <dt>{TEXT.unitPrice}</dt>
                <dd className="tabular-nums">{formatRD(report.pricePerFt2)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="font-semibold">{TEXT.quote}</dt>
                <dd className="font-corazza-serif text-2xl font-medium tabular-nums [font-variant-numeric:lining-nums_tabular-nums]">{formatRD(report.quote)}</dd>
              </div>
            </>
          )}
        </dl>

        <p className="mt-6 font-corazza-sans text-xs leading-relaxed text-corazza-charcoal/80">
          {TEXT.filmNote}
          {report.quote !== null && ` ${TEXT.quoteNote}`}
        </p>
      </div>
    </article>
  );
}
