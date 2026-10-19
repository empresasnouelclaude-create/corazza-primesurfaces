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

## Calculadora interna de ventas (`/calculadora`)

Herramienta para los vendedores: medir varias superficies de un cliente,
calcular pies cuadrados, film recomendado (con margen) y cotización, y ver
un reporte en pantalla. Sigue "Especificaciones Calculadora Corazza" v1.0.

- Dirección: `https://corazza.com.do/calculadora` (no está enlazada desde la
  landing y está excluida de Google con `noindex`).
- No tiene contraseña: cualquiera con el enlace puede abrirla. No guarda
  datos en ningún servidor; si se recarga la página, se pierde lo escrito.
- Fórmulas: `src/app/calculadora/formulas.ts`. Textos y opciones:
  `src/app/calculadora/config.ts`. Estado (agregar, borrar, reset, reporte):
  `src/app/calculadora/state.ts`.
- Pruebas (incluyen las de aceptación de la especificación):

```bash
npm test
```

Para protegerla con contraseña más adelante: Vercel → Settings →
Deployment Protection (plan Pro), o agregar una contraseña propia en
`src/proxy.ts`/middleware.

## Medición de anuncios (Pixel de Meta)

`src/app/components/Medicion.tsx`, montado en `layout.tsx`:

- **Pixel de Meta:** se activa al crear en Vercel la variable `NEXT_PUBLIC_META_PIXEL_ID` (y volver a publicar). Registra visitas (`PageView`) y cada clic a WhatsApp (`Contact`). Sin la variable no se carga nada.
- **Origen de cada cliente:** si la visita llega con UTM (por ejemplo `?utm_source=ig&utm_content=cafe`), al abrir WhatsApp el mensaje termina con `(ref: cafe)`. Usa `utm_content`, si no `utm_campaign`, si no `utm_source`. Funciona aunque no haya Pixel.

## Asistente de WhatsApp (en construcción)

Asistente con IA (Claude) que atiende el WhatsApp de Corazza, recoge los datos para cotizar y pasa el caso al vendedor. El código está en `src/lib/asistente/`:

| Archivo | Qué es |
|---|---|
| `prompt.ts` | Tono y reglas del asistente |
| `conocimiento.ts` | Lo que sabe de Corazza (sale de `portafolio.ts`); lo pendiente está marcado `TODO(dueño)` |
| `herramientas.ts` | Acciones: guardar datos, guía de medición, fotos, pasar al vendedor |
| `motor.ts` | La conversación con la IA |
| `whatsapp.ts` | API de WhatsApp de Meta (webhook, firma, envío) |
| `almacen.ts` | Dónde se guardan las conversaciones (hoy en memoria: **falta la base de datos antes de usarlo con clientes**) |

Rutas:

- `/asistente-prueba`: simulador para probar conversaciones sin WhatsApp (no se guarda nada). Pide la clave `ASISTENTE_PRUEBA_CLAVE`.
- `/api/whatsapp`: webhook para Meta. Sin las variables de abajo responde 503 y no hace nada.

Variables de entorno (Vercel → Settings → Environment Variables):

| Variable | Para qué |
|---|---|
| `ANTHROPIC_API_KEY` | API de Claude |
| `ASISTENTE_MODELO` | Opcional. Modelo de IA; por defecto `claude-opus-5-5` (también `claude-sonnet-5-5` o `claude-haiku-5-5`) |
| `ASISTENTE_PRUEBA_CLAVE` | Clave del simulador |
| `WHATSAPP_TOKEN` | Token de acceso de la app de WhatsApp en Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp de Corazza |
| `WHATSAPP_VERIFY_TOKEN` | Texto que se escribe en Meta al configurar el webhook |
| `WHATSAPP_APP_SECRET` | Secreto de la app de Meta (para comprobar que los avisos vienen de Meta) |

## Reemplazar fotos

Las imágenes viven en `public/`:

- `corazza-logo-cream.png` — logo completo (fondo oscuro)
- `corazza-isotipo.png` — solo el isotipo de las dos ondas
- `hero-producto.jpg` — foto del kit ("Experiencia Corazza")
- `portafolio/cocina-isla-marmol.jpg` — foto del hero (portada del PDF,
  recortada para excluir el texto incrustado)
- `portafolio/comedor-mesa-marmol.webp` — "Portafolio comercial"
- `portafolio/instalacion-lamina.webp` — "La solución"
- `portafolio/muestras-materiales.webp` — "Superficies"
- `portafolio/apartamento-panoramico.webp` — "Aplicaciones"
- `portafolio/gotas-marmol.webp` — "Beneficios"
- `portafolio/servicio-medicion.webp` — "Nuestro servicio"
- `portafolio/acabado-*.jpg` — selector High Gloss / Ultra Matte

Qué foto usa cada sección se define en `PORTFOLIO_IMAGES` de
`src/app/portafolio.ts` (ahí también va el texto alternativo de cada una).

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
5. `CORAZZA_DOMAIN` en `src/app/config.ts` ya apunta a `corazza.com.do`; cámbialo solo si cambia el dominio
   (para que las tarjetas de WhatsApp/redes sociales muestren la URL
   correcta al compartir el link).
