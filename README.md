# AERIX (Aerial Fix): prototipe PWA operator dan teknisi

Kerangka awal prototipe untuk esai HORIZON 2026. **Semua data adalah contoh (ilustratif)**; deteksi AI dan keputusan RL
disimulasikan. Lihat `CLAUDE.md` untuk konteks lengkap dan `PROMPT_CLAUDE_CODE.md` untuk prompt penyelesaian.

> Status: antarmuka operator dan teknisi selesai, lolos typecheck dan build, dan sudah diuji pada mode lokal
> (lihat `docs/PENGUJIAN.md`). Backend server, Web Push, Telegram, dan deploy belum diuji (Tahap 5).

## Menjalankan

```bash
npm install
npm run typecheck     # frontend + API
npm run dev           # UI saja, mode lokal (tanpa server)
npx vercel dev        # UI + fungsi api/ (butuh .env.local)
npm run build
```

Tanpa folder `/api` yang aktif, aplikasi otomatis berjalan dalam **mode lokal** (data di `localStorage`, sinkron antar tab di browser yang sama).

## Menyiapkan backend (Supabase + Vercel)

1. **Supabase**: buat proyek gratis di supabase.com. Buka *SQL Editor*, tempel isi `supabase/schema.sql`, jalankan.
   Di *Project Settings > API* salin **Project URL** dan **service_role key** (rahasia, jangan dibagikan atau di-commit).
2. **Kunci Web Push**: jalankan `npm run vapid`. Salin `VAPID_PUBLIC_KEY`, `VITE_VAPID_PUBLIC_KEY`, dan `VAPID_PRIVATE_KEY`.
3. **Bot Telegram (opsional)**: di Telegram chat dengan @BotFather kirim `/newbot`, simpan token. Kirim satu pesan ke bot (atau
   tambahkan bot ke grup teknisi), lalu buka `https://api.telegram.org/bot<TOKEN>/getUpdates` dan ambil `chat.id`.
4. **GitHub dan Vercel**: `git init`, commit, push ke repositori GitHub baru. Di vercel.com pilih *Add New > Project*, impor repositori
   (framework Vite). Isi *Environment Variables* sesuai `.env.example`, lalu deploy ulang.
   `APP_URL` harus berupa alamat https proyekmu agar tombol "Buka detail" di Telegram berfungsi.

## Menguji notifikasi

- **Android (Chrome):** buka alamat https proyek, pilih peran Teknisi, buka *Profil*, ketuk *Aktifkan notifikasi*.
- **iPhone:** buka di Safari, *Bagikan > Tambahkan ke Layar Utama*, buka dari ikon aplikasi, lalu aktifkan notifikasi di *Profil*.
  Di iPhone, Web Push umumnya hanya bekerja untuk PWA yang sudah ditambahkan ke Layar Utama.
- Di mode Operator, setujui satu baris dengan rekomendasi "Lapor". Teknisi menerima push (dan pesan Telegram bila dikonfigurasi).

## Batasan yang perlu diketahui

- Push tidak dijamin terkirim dan butuh internet di HP teknisi. Telegram berfungsi sebagai cadangan.
- Mode offline menyimpan antrean aksi di perangkat dan mengirimnya saat online. Sinkronisasi latar belakang terbatas, terutama di iPhone.
- Aplikasi ini bukan sistem produksi: PIN opsional (`APP_PIN`) hanya perlindungan dasar, dan data adalah contoh.
