-- AERIX: skema database untuk prototipe.
-- Jalankan sekali di Supabase: SQL Editor > New query > tempel > Run.

create table if not exists decisions (
  panel_id   text primary key,
  action     text not null check (action in ('Tunggu', 'Hembus', 'Semprot', 'Lapor')),
  status     text not null check (status in ('menunggu', 'disetujui', 'ditolak')),
  water_ml   integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id             text primary key,            -- sama dengan ID panel
  panel_id       text not null,
  cls            text not null,
  priority       text not null check (priority in ('Tinggi', 'Sedang', 'Rendah')),
  distance_m     integer not null default 0,
  action_text    text not null default '',
  status         text not null default 'baru' check (status in ('baru', 'dikerjakan', 'selesai')),
  action_done    text,
  note           text,
  safety_checked boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists push_subscriptions (
  endpoint   text primary key,
  p256dh     text not null,
  auth       text not null,
  role       text not null default 'teknisi',
  created_at timestamptz not null default now()
);

-- Row Level Security aktif tanpa kebijakan: browser (kunci anon) tidak bisa
-- mengakses tabel ini. Hanya fungsi serverless dengan service role key yang bisa.
alter table decisions enable row level security;
alter table tasks enable row level security;
alter table push_subscriptions enable row level security;
