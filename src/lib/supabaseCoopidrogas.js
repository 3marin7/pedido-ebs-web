// src/lib/supabaseCoopidrogas.js
// Cliente Supabase para la base de datos de Coopidrogas (catálogo externo con EAN)
//
// TABLA RECOMENDADA (ejecutar en tu proyecto Supabase de Coopidrogas):
// -----------------------------------------------------------------------
// create table if not exists catalogo_coopidrogas (
//   id              bigserial primary key,
//   ean             text unique not null,
//   material        text,
//   denominacion    text not null,
//   proveedor       text,
//   grupo           text,
//   sub_grupo       text,
//   centro          text,
//   lote            text,
//   und             text,
//   cantidad        numeric(14,4),
//   venta_real      numeric(14,2),
//   venta_cte       numeric(14,2),
//   impuesto        numeric(6,2),
//   boni_pct        numeric(6,2),
//   catalogo        text,
//   fecha_creac     date,
//   updated_at      timestamptz default now()
// );
// create index if not exists idx_coopidrogas_ean on catalogo_coopidrogas (ean);
// create index if not exists idx_coopidrogas_denom on catalogo_coopidrogas
//   using gin (to_tsvector('spanish', denominacion));
//
// RLS: habilitar y crear política SELECT para anon/authenticated según necesites.
// -----------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_COOPIDROGAS_URL;
const key  = import.meta.env.VITE_COOPIDROGAS_ANON_KEY;

if (!url || !key) {
  console.warn(
    '[supabaseCoopidrogas] Las variables VITE_COOPIDROGAS_URL y VITE_COOPIDROGAS_ANON_KEY ' +
    'no están definidas en .env.local. La consulta a Coopidrogas no funcionará.'
  );
}

export const supabaseCoopidrogas = url && key ? createClient(url, key) : null;
