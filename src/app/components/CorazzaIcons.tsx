// Set minimo de iconos en linea (trazo 1.5, mismo estilo en todos) para no
// sumar una libreria externa completa por un puñado de glifos. Cada uno
// hereda color y tamaño de quien lo use via className.

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.46-.15-.65.14-.2.3-.75.94-.92 1.13-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.71-1.61-2-.17-.3-.02-.46.13-.6.13-.13.29-.34.44-.52.15-.17.19-.3.29-.49.1-.2.05-.37-.02-.52-.08-.15-.65-1.58-.9-2.16-.23-.56-.47-.49-.65-.5h-.56c-.2 0-.51.07-.78.37-.26.3-1.02 1-1.02 2.42s1.05 2.8 1.19 3c.15.2 2.06 3.16 5 4.43.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34Z" />
      <path d="M12.04 2a9.94 9.94 0 0 0-8.5 15.05L2 22l5.1-1.5A9.94 9.94 0 1 0 12.04 2Zm0 18.05c-1.6 0-3.13-.43-4.46-1.24l-.32-.19-3.03.89.9-2.95-.2-.31A8.06 8.06 0 1 1 12.04 20Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82a4.56 4.56 0 0 1-3.14-1.26v8.5a5.14 5.14 0 1 1-4.42-5.09v2.36a2.78 2.78 0 1 0 1.95 2.65V2h2.47a4.56 4.56 0 0 0 4.42 4.5v2.32a6.9 6.9 0 0 1-1.28-.12v-2.88Z" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5Z" />
    </svg>
  );
}

export function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  );
}

export function ImagesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M7 15l2.5-3 2 2.2L15 11l2 2" />
      <circle cx="7.5" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3Z" />
      <path d="m9.2 12 1.9 1.9 3.7-3.9" />
    </svg>
  );
}

// Aviso / nota importante (circulo con signo de exclamacion).
export function NoticeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.25" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
