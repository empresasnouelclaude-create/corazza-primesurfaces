# Corazza Prime Surfaces

Landing page "link in bio" de Corazza Prime Surfaces. Proyecto Next.js
independiente: no depende de ninguna otra plataforma, base de datos ni
variable de entorno para funcionar.

## Editar contenido

Casi todo lo que cambia con el tiempo vive en un solo archivo:
**`src/app/config.ts`**

- Número de WhatsApp y mensajes predefinidos
- Instagram / TikTok
- Superficies que se protegen
- Pasos de "Cómo funciona"
- Galería antes/después
- Dominio (para metadata de Open Graph)

El **portafolio comercial** (secciones debajo de los enlaces, tomadas del PDF
"Corazza_Preliminar_High_Gloss_Ultra_Matte.pdf") vive aparte, en
**`src/app/portafolio.ts`**. Ese texto está copiado literalmente del PDF:
si el documento cambia, se reemplaza ahí tal cual, sin reescribirlo.

La guía **"¿CÓMO MEDIR MI TOPE?"** (sección `#como-medir`) toma su texto de
**`src/app/guia-medicion.ts`**.

## Reemplazar fotos

Las imágenes viven en `public/`:

- `corazza-logo-cream.png` — logo completo (fondo oscuro)
- `corazza-isotipo.png` — solo el isotipo de las dos ondas
- `hero-producto.jpg` — foto del hero (escritorio) y de "Experiencia Corazza"
- `portafolio/cocina-isla-marmol.jpg` — foto de la portada del PDF (recortada
  para excluir el texto incrustado)
- `portafolio/isla-marmol-detalle.jpg` — foto interior del PDF (340 × 512,
  baja resolución)

Para las fotos del portafolio hay un campo `hiRes` en `src/app/portafolio.ts`:
al agregar ahí una versión de mayor resolución de la misma foto, la página la
usa automáticamente.

Las fotos de "antes y después" todavía son placeholders (ver
`src/app/components/Gallery.tsx` y `GALLERY_PLACEHOLDERS` en `config.ts`).
Cuando tengas las fotos reales, agrégalas a `public/` y actualiza esas dos
referencias.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Publicar en Vercel

1. Importa este repositorio en Vercel (vercel.com/new).
2. Framework: Next.js (detectado automáticamente). No hace falta
   configurar ninguna variable de entorno.
3. Deploy.
4. En Settings → Domains, agrega tu dominio comprado y sigue las
   instrucciones de DNS de Vercel.
5. Actualiza `CORAZZA_DOMAIN` en `src/app/config.ts` con el dominio real
   (para que las tarjetas de WhatsApp/redes sociales muestren la URL
   correcta al compartir el link).
