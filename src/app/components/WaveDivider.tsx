// Detalle de "patron de olas" muy discreto para separar secciones -- una
// unica linea organica (no el isotipo de marca, que solo se usa como
// imagen oficial en Hero/Footer), pensada como textura de fondo, nunca como
// protagonista. Estatica: alcanza para "sentirse vivo" sin animacion.
export default function WaveDivider({
  className = "",
  toneClassName = "text-corazza-taupe/25",
}: {
  className?: string;
  toneClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      className={`h-10 w-full ${toneClassName} ${className}`}
      aria-hidden
    >
      <path
        d="M0 40c120-28 240 28 360 12s220-46 340-24 220 48 340 22 200-40 160-10"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}
