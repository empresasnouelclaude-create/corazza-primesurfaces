-- Base de datos de Corazza (Supabase).
-- Se pega UNA vez en Supabase → SQL Editor → New query → Run.
-- Se puede volver a correr sin problema: no borra nada.
--
-- Todas las tablas tienen RLS activado y sin politicas: nadie puede leerlas
-- desde el navegador. Solo el servidor de la web (con la clave service_role)
-- entra a los datos.

-- Conversaciones del asistente de WhatsApp (una por telefono).
create table if not exists conversaciones (
  id text primary key,                    -- telefono, sin "+"
  estado text not null default 'asistente', -- 'asistente' | 'vendedor'
  datos jsonb not null default '{}',       -- ficha del cliente
  mensajes jsonb not null default '[]',    -- historial con la IA
  pase jsonb,                              -- cuando se paso al vendedor
  actualizado timestamptz not null default now()
);

-- Mensajes de WhatsApp ya atendidos (Meta a veces reenvia el mismo aviso).
create table if not exists mensajes_atendidos (
  id text primary key,
  creado timestamptz not null default now()
);

-- Documentos leidos de los PDF de Citrus.
create table if not exists documentos_citrus (
  id uuid primary key,
  datos jsonb not null,                    -- el documento completo
  subido timestamptz not null default now()
);

-- Ultimo reporte de inventario de Citrus (una sola fila).
create table if not exists inventario_citrus (
  id int primary key default 1 check (id = 1),
  productos jsonb not null default '[]',
  fecha timestamptz not null default now()
);

alter table conversaciones enable row level security;
alter table mensajes_atendidos enable row level security;
alter table documentos_citrus enable row level security;
alter table inventario_citrus enable row level security;

-- Carpeta privada para los PDF de Citrus.
insert into storage.buckets (id, name, public)
values ('citrus', 'citrus', false)
on conflict (id) do nothing;

-- Mensajes enviados desde el panel (herramienta "WhatsApp" del panel).
create table if not exists envios_whatsapp (
  id uuid primary key default gen_random_uuid(),
  remitente text not null,                 -- 'corazza', 'flota1'…
  para text not null,                      -- telefono del cliente
  nombre text,                             -- nombre del cliente (opcional)
  tipo text not null,                      -- 'texto' | 'plantilla'
  contenido text not null,                 -- texto enviado o nombre de la plantilla
  wamid text,                              -- id del mensaje en WhatsApp
  estado text not null default 'enviado',  -- enviado | entregado | leido | fallido
  error text,                              -- motivo si fallo
  creado timestamptz not null default now()
);
create index if not exists envios_whatsapp_wamid on envios_whatsapp (wamid);
alter table envios_whatsapp enable row level security;

-- Codigo de cliente: numero secuencial de 4 digitos (0001, 0002…) que
-- identifica cada caso en todo el panel. Se asigna solo al crear la
-- conversacion; las que ya existian reciben el suyo al correr esto.
create sequence if not exists codigo_cliente_seq start 1;
alter table conversaciones add column if not exists codigo int unique default nextval('codigo_cliente_seq');
alter table envios_whatsapp add column if not exists codigo int;
