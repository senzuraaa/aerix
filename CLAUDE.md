# AERIX PWA: konteks proyek untuk Claude Code

Prototipe PWA untuk esai lomba HORIZON 2026 (Kamase UGM, tema "Charge the Future: Bold Ideas for the Energy Evolution").
Gagasan: **AERIX (Aerial Fix)**, drone dengan kamera termal + RGB yang memeriksa panel surya PLTS Oelpuah
(5 MWp, Kupang, NTT, sekitar 22.000 panel, 5 zona), lalu memilih tindakan per panel dengan reinforcement learning:
tunggu, hembus, semprot sedikit air, atau lapor ke teknisi. Aplikasi ini adalah antarmuka **operator (PC)** dan **teknisi (HP)**.

## Aturan paling penting (kejujuran)
- Semua data **contoh/ilustratif**. Deteksi 14 kelas (CNN) dan keputusan RL **disimulasikan** dengan aturan sederhana.
- Jangan menulis atau menampilkan klaim AI sungguhan, data waktu nyata, atau notifikasi yang tidak benar-benar ada.
- Setiap layar membawa label kecil "Data ilustratif". Jangan menghapusnya.
- Skala "Skor IEC" (mis. "3 dari 5") hanyalah placeholder. Jangan dianggap standar resmi.
- Jangan commit rahasia (`.env.local`, service role key, VAPID private key, token Telegram).
- Tanyakan dulu sebelum: membuat akun, `git push`, deploy, atau menjalankan perintah yang mengubah akun milik pengguna.

## Stack
- Frontend: Vite + React 19 + TypeScript (`src/`), react-router-dom, font self-hosted `@fontsource/ibm-plex-*`.
- Backend: fungsi serverless Vercel (`api/`, TypeScript, CommonJS) + Supabase Postgres (diakses **hanya** dari server dengan service role key; RLS aktif tanpa kebijakan).
- Notifikasi: Web Push (`web-push`, kunci VAPID) + bot Telegram opsional.
- PWA: `public/sw.js` (cache cangkang aplikasi + push + notificationclick), `public/manifest.webmanifest`, ikon di `public/icons`.
- Toolchain: TypeScript 7, Vite 8. `api/tsconfig.json` memakai `Node16`.

## Status saat ini
Selesai dan lolos `tsc`:
- Konfigurasi, `supabase/schema.sql`, `vercel.json`, `.env.example`, `scripts/generate-vapid.mjs`
- `api/*` (state, decision, task, subscribe, test-notification, reset) dan `api/_lib/*`
- `src/lib/*`: `types`, `classes`, `panels` (data contoh deterministik), `backend` (server + mode lokal), `store` (status bersama, polling, antrean offline), `notify`, `push`
- `src/components/Icon.tsx`, `src/components/PanelImages.tsx` (gambar RGB/termal dari CSS)
- `public/sw.js`, manifest, ikon PNG

- Cangkang: `src/main.tsx`, `src/App.tsx` (rute), `src/styles.css`, `PrototypeBar`, `ToastHost`, `PinGate`, `ConfirmDialog`, `Chips`
- Operator (`src/pages/operator/`): `OperatorLayout` + `filters.ts` (filter bersama), Peta Kondisi, Rekomendasi, Misi Langsung, Laporan (CSV), Segera Hadir
- Teknisi (`src/pages/teknisi/`): `TechLayout`, Tugas Saya, Detail Temuan, Pesan, Profil, Pindai, Peta
- `src/lib/actions.ts` (aturan tindakan), `src/lib/mission.ts` (simulasi misi di luar komponen), `src/lib/install.ts` (`beforeinstallprompt`)
- `npm run build` lolos; mode lokal diuji di browser (lihat `docs/PENGUJIAN.md`)

**Belum:** README final dan deploy (Tahap 5). Belum pernah dijalankan: `vercel dev`, Supabase, Web Push, Telegram, PIN,
dan perangkat nyata (Android/iPhone). Tidak ada pengujian otomatis.

## Arsitektur data
- Panel dibangkitkan di klien (`PANELS`, 5 zona x 12 baris x 10 kolom = 600 panel contoh, seed tetap). ID: `Z{zona}-S{string}-B{baris}-K{kolom}`.
- 7 kelas: Normal, Kotor, Vegetasi, Sel panas, Sel panas ganda, Sirkuit terbuka, Retak sel.
- Rekomendasi (berbasis aturan): Kotor -> Tunggu/Hembus/Semprot (50-100 ml); Vegetasi -> Lapor;
  Sel panas, Sel panas ganda, Sirkuit terbuka, Retak sel -> Lapor dan semprot **dikunci** ("Semprot dikunci: rusak internal").
- 7 panel "pin" (lihat `PINNED_KEYS` di `panels.ts`) sama dengan baris di mockup, jadi gambar di esai dan prototipe konsisten.
- Alur utama: operator menyetujui baris "Lapor" -> `POST /api/decision` -> tugas dibuat -> Web Push + Telegram ke teknisi -> teknisi buka `/teknisi/tugas/:panelId` -> "Tandai Selesai" -> `POST /api/task`.
- Dua backend di `src/lib/backend.ts`: `remoteBackend` (Vercel + Supabase) dan `localBackend` (localStorage, sinkron antar tab).
  Aplikasi mendeteksi sendiri. Tanpa `/api`, aplikasi berjalan penuh dalam "mode lokal".
- Offline: operasi tulis masuk antrean `aerix.pending` (localStorage) dan dikirim saat online. Ada saklar "Simulasi offline" di `PrototypeBar` untuk demo.
- Polling `/api/state` tiap 4 detik. PIN opsional lewat env `APP_PIN` (header `x-app-pin`).

## Desain
Tema terang. Font IBM Plex Sans (teks) dan IBM Plex Mono (ID).
Navy `#0F2A43`, teal `#0B6E78` (teal gelap `#084F57`, tint `#DFF0F2`), latar `#F3F5F8`, kartu putih, garis `#E1E6EC`, teks sekunder `#5B6B7C`.
Status: Normal `#A8DABB`, Kotor `#F0A21F`, Vegetasi `#7A55C8`, hotspot merah `#E5483D`, rusak internal `#7A1616`, aksi berjalan biru `#2D6FDB`, bahaya `#C62828`.
Kartu bersudut membulat (12px), bayangan halus, ikon garis (lihat `Icon.tsx`), tidak ada emoji. Target sentuh minimal 44px. Semua teks UI Bahasa Indonesia.

## Perintah
- `npm run dev` : UI saja (mode lokal, tanpa API)
- `npx vercel dev` : UI + fungsi `api/` (butuh `.env.local` dan akun Vercel)
- `npm run typecheck` : frontend + API
- `npm run build` : typecheck + build produksi
- `npm run vapid` : buat pasangan kunci VAPID

## Konvensi kode
- TypeScript strict, tanpa `any` kecuali di pemetaan baris database (`api/_lib/db.ts`).
- Komponen fungsi React, state bersama lewat `useStore()`, gaya lewat `src/styles.css` (kelas, bukan inline berat).
- Semua tombol memakai `<button>`, tautan `<a>`/`<Link>`, label untuk input, `aria-label` untuk tombol ikon.
- Jangan menambah dependensi besar tanpa alasan. Tidak ada library UI pihak ketiga.
