# Hasil pengujian AERIX PWA (Tahap 4)

Tanggal uji: 10 Oktober 2026. Lingkungan: Windows 11, Node v24.21.0, browser bawaan aplikasi Claude (berbasis Chromium).
Semua data pada aplikasi adalah contoh (ilustratif). Dokumen ini hanya mencatat apa yang benar-benar dijalankan.

## Ringkasan

| Bagian | Hasil |
| --- | --- |
| `npm run typecheck` (frontend + API) | Lolos, tanpa galat |
| `npm run build` | Lolos (JS 349,5 kB, gzip 107,6 kB; CSS 38,0 kB) |
| Alur dua tab mode lokal (operator ke teknisi ke laporan) | Lolos |
| Simulasi offline (operator dan teknisi) | Lolos |
| Tanpa scroll horizontal pada 360, 768, 1280, 1920 | Lolos di 11 rute |
| Navigasi keyboard (peta, dialog) | Lolos untuk yang diuji, lihat batasan |
| Build produksi + service worker (`vite preview`) | Lolos |
| Backend server, Web Push, Telegram, PIN, perangkat nyata | **Belum diuji** |

## Cara pengujian

Pengujian dilakukan oleh Claude Code di browser bawaan, bukan oleh manusia di perangkat nyata.
Sebagian besar klik dijalankan lewat skrip (`element.click()` dan peristiwa `input`/`change`), lalu hasilnya dibaca dari DOM
dan `localStorage`. Tombol keyboard (Tab, panah, Enter, Esc) dikirim sebagai penekanan tombol sungguhan.
Artinya logika dan tata letak terverifikasi, tetapi rasa pemakaian dengan jari atau tetikus belum dinilai manusia.

## Yang diuji dan hasilnya

### 1. Cangkang
- `/` pada lebar 1280 mengarah ke `/operator/peta`; pada lebar 961 mengarah ke `/teknisi` (batas 1024).
- Strip prototipe tampil di semua rute: saklar peran, "Simulasi offline", indikator "Mode lokal (tanpa server)",
  "Atur ulang demo", dan label "Data ilustratif".
- "Atur ulang demo" membuka dialog konfirmasi, lalu mengosongkan keputusan dan tugas.

### 2. Alur utama (dua tab, mode lokal)
1. Tab operator, Rekomendasi Tindakan: "Setujui" pada baris `Z2-S07-B12-K05` (Lapor). Baris berubah menjadi
   "Diteruskan ke teknisi", toast "1 tugas dibuat untuk teknisi (mode lokal, tanpa push)".
2. Tab teknisi (terbuka sejak awal): dalam 2 detik tugas muncul di tab "Baru", toast
   "Tugas baru. Prioritas Tinggi: Z2-S07-B12-K05", lencana Pesan menunjukkan 1.
3. Detail Temuan: "Tandai Selesai" nonaktif sampai kotak keselamatan dicentang. Memilih tindakan mengubah status menjadi
   "dikerjakan". Setelah "Tandai Selesai" status menjadi "selesai", catatan tersimpan, kembali ke Tugas Saya.
4. Laporan: ringkasan dan kedua tabel menampilkan keputusan dan tugas tersebut.
5. CSV: isi berkas diperiksa (14 kolom, pemisah `;`, kutip ganda di-escape, kolom "Keterangan" berisi "Data ilustratif",
   nama `aerix-ringkasan-2026-10-10.csv`). Lihat batasan soal penyimpanan berkas.

### 3. Rekomendasi Tindakan
- Tabel: 136 temuan, 7 baris per halaman, 7 panel pin di halaman pertama sesuai urutan mockup.
- "Ubah" pada kelas terkunci: pilihan Hembus dan Semprot nonaktif. "Ubah" Hembus menjadi Semprot memberi estimasi 60 ml.
- "Tolak" lalu "Urungkan" mengembalikan baris ke keadaan menunggu.
- "Setujui semua yang aman" dengan anggaran 2.500 ml: 118 disetujui (Tunggu 43, Hembus 51, Semprot 24, total 1.845 ml),
  baris Lapor dan baris terkunci tidak ikut.
- Dengan anggaran 300 ml: 98 disetujui, toast "20 baris Semprot dilewati karena melebihi anggaran air", terpakai 275 ml.
  Menyetujui satu Semprot 100 ml setelahnya ditolak dengan peringatan.
- "Maks. siklus ulang" dan "Prioritas zona" tersimpan; urutan "Sortie Pagi Ini" ikut berubah.

### 4. Misi Langsung dan keselamatan
- Cakupan mulai 58% dan tidak reset saat pindah halaman lewat menu: 59% di Rekomendasi, 60% di Misi Langsung, lalu 61%
  setelah melewati Peta dan Laporan dan kembali ke Rekomendasi. Memuat ulang halaman mengembalikannya ke 58%.
- Angin 35 km/jam: "Tunda terbang", sortie 2 "Ditunda", misi berhenti maju. Angin 14 km/jam: kembali "Aman terbang".
- "Jeda" dan "Lanjutkan" berfungsi. "Kembali ke Pangkalan (Darurat)": dialog, "Batal" tidak mengubah apa pun,
  konfirmasi membuat drone kembali ke H dan tombol darurat nonaktif.

### 5. Simulasi offline
- Operator offline menyetujui Lapor: toast "Tersimpan di perangkat...", strip menampilkan "1 aksi menunggu sinkron",
  data bersama belum berubah. Saat saklar dimatikan antrean terkirim dan tugas muncul di tab teknisi.
- Teknisi offline menandai selesai: lencana "Offline - data tersimpan", kartu berlabel "Menunggu sinkron",
  data bersama masih "baru". Saat online lagi status bersama menjadi "selesai" dan antrean kosong.

### 6. Responsif
Diukur `document.documentElement.scrollWidth <= window.innerWidth` pada lebar 360, 768, 1280, dan 1920 untuk 11 rute:
operator (peta, rekomendasi, misi, laporan, jadwal) dan teknisi (tugas, detail, peta, pindai, pesan, profil).
Semua lolos. Di bawah 900 px sidebar operator menjadi tombol "Menu" di atas.

### 7. Keyboard
- Peta: urutan Tab masuk akal (strip, menu, filter, mode peta, lalu satu kotak per zona). Dari 600 kotak hanya 5 yang
  masuk urutan Tab; tombol panah berpindah antar kotak dalam satu zona; Enter memilih panel. Fokus terlihat (garis 3 px).
- Dialog: fokus masuk ke dialog, Tab tetap di dalam, Esc menutup dan fokus kembali ke tombol pemicu.

### 8. Build produksi
`vite preview`: service worker terdaftar dan aktif, cache `aerix-v1` berisi cangkang, tanpa galat konsol.
Setelah server dimatikan, memuat ulang `/teknisi` tetap menampilkan aplikasi dari cache.

## Yang TIDAK diuji

- **Backend server** (`npx vercel dev`, Supabase): `api/*` hanya lolos typecheck, belum pernah dijalankan.
  Termasuk mode "Terhubung ke server", polling `/api/state`, dan penanganan galat server.
- **Web Push dan Telegram**: belum ada kunci VAPID maupun bot. Tombol "Aktifkan notifikasi" dan "Kirim notifikasi uji"
  hanya diuji pada mode lokal, tempat keduanya menjelaskan bahwa push tidak tersedia.
- **PinGate**: dialog PIN belum pernah muncul karena tidak ada server yang menjawab 401.
- **Perangkat nyata**: belum diuji di Android, iPhone, Safari, maupun Firefox. "Pasang aplikasi" (`beforeinstallprompt`)
  tidak muncul di browser uji, jadi hanya keadaan nonaktifnya yang terlihat.
- **Unduhan CSV ke disk**: isi dan nama berkas diverifikasi dengan mencegat unduhan; penyimpanan berkas oleh browser
  dan tampilan di Excel belum dicoba.
- **Foto bukti**: input berkas dan pratinjau belum diuji (butuh berkas dan kamera).
- **Pembaca layar** dan pemeriksaan kontras otomatis belum dijalankan.
- **Keyboard di semua halaman**: yang diuji hanya peta dan dialog. Tabel rekomendasi dan formulir teknisi memakai elemen
  bawaan (`button`, `select`, `input`), tetapi urutannya belum ditelusuri satu per satu.
- **Kecocokan dengan mockup**: `docs/mockups/` tidak ada, jadi tata letak dibuat dari deskripsi di prompt saja.
- **Pengujian otomatis**: tidak ada unit test atau e2e test di repositori.

## Batasan dan keputusan yang perlu diketahui

- **Target sentuh 44 px**: kotak peta (600 kotak) lebih kecil dari 44 px, karena peta ditujukan untuk operator di PC.
  Tombol di antarmuka operator setinggi 40 px (32 px untuk tombol kecil) dengan tetikus dan 44 px pada layar sentuh
  (`pointer: coarse`). Antarmuka teknisi selalu 44 px atau lebih.
- **Tata letak Rekomendasi di bawah 1500 px**: tabel memakai lebar penuh di atas, kartu Cek Keselamatan, Sortie, dan
  Misi Langsung turun ke bawahnya. Tiga kolom penuh baru tampil mulai 1500 px. Di lebar sempit tabel bergulir
  mendatar di dalam kartunya, bukan halamannya.
- **Perubahan pada `src/lib/store.tsx`**: saklar "Simulasi offline" kini disimpan di `sessionStorage` (per tab), bukan
  `localStorage`. Sebelumnya tab lain yang dimuat saat saklar menyala ikut offline dan tidak pulih sendiri.
- **Tambahan di luar prompt**: tombol "Urungkan" pada baris yang sudah diputuskan, "Ulangi simulasi" setelah drone di
  pangkalan, dan berkas `.env.example` (disebut di README tetapi sebelumnya tidak ada).
- **Hilang saat muat ulang**: keadaan misi, pilihan "Ubah" yang belum diputuskan, dan filter operator hanya ada di memori.
- **Toast tugas baru** hanya muncul bila antarmuka teknisi sedang terbuka. Tanpa server tidak ada push sama sekali.
- **CSV memakai pemisah `;`** supaya langsung terbuka per kolom di Excel berbahasa Indonesia.
- **Koordinat dan jarak adalah contoh**: "Buka Navigasi ke Panel" membuka Google Maps ke titik contoh, bukan posisi panel
  sebenarnya.
- **Saat pengembangan**: menyunting `store.tsx` ketika `npm run dev` berjalan memunculkan galat konsol
  "useStore harus dipakai di dalam AppProvider" sampai halaman dimuat ulang (efek HMR). Tidak muncul di build produksi.

## Mengulang pengujian

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Buka `http://localhost:5173/operator/rekomendasi` dan `http://localhost:5173/teknisi` di dua tab pada browser yang sama,
lalu ikuti langkah pada bagian 2 dan 5.
