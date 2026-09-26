import Image from "next/image";

// Espacio para fotografia real, claramente identificado como placeholder
// (no una foto de stock generica sin relacion con superficies): un fondo
// degradado en tonos de marca con el isotipo como marca de agua muy suave,
// y una etiqueta con el nombre de archivo esperado -- asi, en cuanto el
// cliente entregue fotos reales, sabe exactamente donde y como colocarlas.
//
// TODO(cliente): reemplaza por fotografias reales de proyectos/superficies.
// Recomendado: JPG/WebP optimizado, mismo encuadre para pares antes/despues.
export default function PlaceholderPhoto({
  label,
  suggestedFile,
  aspectClassName = "aspect-[4/5]",
  className = "",
}: {
  label: string;
  suggestedFile: string;
  aspectClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex ${aspectClassName} w-full items-end overflow-hidden rounded-2xl bg-gradient-to-br from-corazza-cream via-corazza-beige/70 to-corazza-taupe/60 ${className}`}
      role="img"
      aria-label={`Espacio reservado para fotografia: ${label}`}
    >
      <Image
        src="/corazza-isotipo.png"
        alt=""
        fill
        sizes="(max-width: 768px) 90vw, 480px"
        className="object-contain object-center p-10 opacity-25 mix-blend-multiply"
      />
      <div className="relative z-10 w-full bg-corazza-charcoal/80 px-4 py-3 backdrop-blur-sm">
        <p className="font-corazza-sans text-[11px] uppercase tracking-[0.14em] text-corazza-white/90">
          {label}
        </p>
        <p className="font-corazza-sans text-[10px] text-corazza-white/55">
          Reemplazar: {suggestedFile}
        </p>
      </div>
    </div>
  );
}
