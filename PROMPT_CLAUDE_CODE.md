# Prompt untuk Claude Code

Cara pakai: buka folder proyek ini di terminal, jalankan `claude`, lalu tempel prompt di bawah.
Claude Code akan membaca `CLAUDE.md` otomatis. (Opsional) ekspor 4 mockup dari kanvas Claude ke
`docs/mockups/` dalam bentuk PNG supaya bisa dilihat Claude Code, lalu sebut di prompt.

---

```
Baca CLAUDE.md dan seluruh isi src/lib, src/components, api, supabase, public lebih dulu.
Proyek ini adalah kerangka awal PWA AERIX yang sudah lolos typecheck tetapi belum punya halaman.
Tugasmu: selesaikan aplikasinya sampai bisa dijalankan, diuji, dan di-deploy.

LANGKAH 0 (rencana)
Buat rencana singkat dan tampilkan sebelum menulis kode. Kerjakan bertahap, jalankan
`npm run typecheck` dan `npm run build` setelah tiap tahap, dan perbaiki galat sebelum lanjut.
Tanyakan dulu sebelum membuat akun, git push, atau deploy. Jangan pernah commit rahasia.

TAHAP 1: Cangkang aplikasi
- src/main.tsx: render ke #root, BrowserRouter, AppProvider (dari src/lib/store.tsx), impor font
  @fontsource/ibm-plex-sans (400/500/600/700) dan @fontsource/ibm-plex-mono (500), impor styles.css.
  Daftarkan /sw.js hanya saat produksi (import.meta.env.PROD).
- src/App.tsx dengan rute:
  "/"                       -> redirect: lebar < 1024px ke /teknisi, selain itu /operator/peta
  /operator                 -> OperatorLayout; anak: peta, rekomendasi, misi, laporan, dan halaman
                               "Segera hadir" untuk beranda (redirect ke peta), jadwal, analitik, armada, pengaturan
  /teknisi                  -> TechLayout; anak: index (Tugas Saya), tugas/:panelId (Detail Temuan),
                               peta, pindai, pesan, profil
- Komponen global: PrototypeBar (strip tipis di atas: saklar "Operator (PC)" | "Teknisi (HP)",
  saklar "Simulasi offline", indikator mode "Terhubung ke server" / "Mode lokal (tanpa server)",
  tombol "Atur ulang demo" dengan konfirmasi, teks "Data ilustratif"), ToastHost (dari store.toasts),
  PinGate (dialog PIN saat store.needPin).
- src/styles.css: token desain dari CLAUDE.md, kelas untuk kartu, chip, tombol, tabel, dan tata letak.

TAHAP 2: Antarmuka operator (desktop, fluid sampai tablet; di bawah 900px sidebar jadi menu atas)
Sidebar: Beranda, Jadwal & Pemicu, Misi Langsung, Peta Kondisi, Rekomendasi Tindakan, Laporan,
Analitik, Armada Drone, Pengaturan, plus kartu "PLTS Oelpuah" dan status drone.
Bilah atas (satu konteks filter bersama untuk Peta dan Rekomendasi): judul halaman, pilihan zona
("Zona 1 - Zona 5" atau satu zona), tombol tanggal (dekoratif), filter keparahan
(Semua, Hanya temuan, Tinggi, Sedang, Rendah, Kotor), kolom "Cari ID panel", avatar "Operator".

1. Peta Kondisi
   - 4 kartu ringkasan dihitung dari data: "Panel diperiksa" (600 contoh dari sekitar 22.000),
     "Perlu dibersihkan" (kelas Kotor), "Dilaporkan ke teknisi" (jumlah tugas dibanding temuan yang perlu lapor),
     "Panel normal".
   - Peta 5 blok zona (grid 10x12, tiap kotak = tombol dengan aria-label "ID, kelas"). Saklar
     "RGB | Termal | Bandingkan": RGB = warna status, Termal = warna panas (CLASS_INFO.heat),
     Bandingkan = kotak terbelah diagonal. Filter dan pencarian meredupkan kotak yang tidak cocok.
     Legenda: Normal, Kotor, Vegetasi, "Sel panas · Sel panas ganda", "Sirkuit terbuka · Retak sel".
     Blok keenam "Pangkalan Drone".
   - Klik kotak membuka "Detail Panel": ID (mono), chip kelas, gambar RGB dan "Termal IR"
     (ThermalImage/RgbImage), zona, string, "Baris / Kolom", koordinat GPS, bilah "Keyakinan model",
     "Tindakan direkomendasikan" (chip) beserta alasan, tombol "Teruskan ke teknisi" (memanggil
     decide dengan Lapor + task; nonaktif jika sudah ada tugas) dan "Riwayat panel" (linimasa status).
     Panel terpilih awal: Z2-S04-B09-K06.
2. Rekomendasi Tindakan
   - Kolom kiri: kartu "Cek Keselamatan" (Angin dengan batas 28 km/jam dan slider simulasi angin dari
     store.wind, Baterai 62% minimal 30%, Hujan "Tidak hujan", Tangki air 1,6 L dari 2,5 L). Status "Aman terbang"
     hijau; jika angin > 28 menjadi "Tunda terbang" merah. Kartu "Sortie Pagi Ini" yang urutannya mengikuti
     settings.zoneOrder (sortie 1 selesai, 2 berjalan, 3 terjadwal).
   - Tengah: tombol "Setujui semua yang aman" dan tabel "Rekomendasi AI per Panel", 7 baris per halaman
     dengan paginasi, urutan TABLE_ORDER (7 panel pin dulu). Kolom: ID Panel, Kelas, Rekomendasi (chip
     Tunggu/Hembus/Semprot/Lapor dengan ikon), Alasan singkat (+ ikon gembok dan teks "Semprot dikunci:
     rusak internal" untuk kelas terkunci), "Estimasi air (ml)", Keputusan.
     Tombol per baris: "Setujui", "Ubah" (pilihan tindakan; Semprot dan Hembus tidak boleh untuk kelas
     terkunci), "Tolak". Setelah diputuskan tampil lencana "Disetujui"/"Ditolak"; baris yang diteruskan ke
     teknisi tampil "Diteruskan ke teknisi". "Setujui semua yang aman" hanya menyetujui Tunggu/Hembus/Semprot
     yang tidak terkunci dan menghormati anggaran air (beri peringatan bila ada yang dilewati).
     Menyetujui "Lapor" memanggil store.decide dengan objek task (cls, priority, distanceM, actionText, lat, lng).
   - Kanan: kartu "Misi Langsung" (lihat 3).
   - Strip bawah: "Anggaran air per misi" (input ml + bilah terpakai, simpan di settings),
     "Maks. siklus ulang: 2" (pilihan 1/2/3), "Prioritas zona" (urutan zona dengan tombol naik/turun).
3. Misi Langsung (kartu di halaman rekomendasi dan halaman sendiri)
   Peta SVG jalur zig-zag, ikon drone beranimasi di sepanjang jalur (setInterval 1 dtk), telemetri
   (Baterai turun pelan, Sinyal RTK "Fix", Jarak Lidar 15 cm, Air tersisa turun saat semprot),
   "Progres cakupan" (mulai 58%), tombol "Jeda"/"Lanjutkan", dan tombol merah
   "Kembali ke Pangkalan (Darurat)" dengan dialog konfirmasi lalu drone kembali ke H.
   Angin di atas 28 km/jam menunda misi. Simpan keadaan di luar komponen agar tidak reset saat pindah halaman.
4. Laporan
   Ringkasan keputusan (disetujui, ditolak, diteruskan, estimasi air terpakai), tabel keputusan dan tugas
   beserta statusnya, dan tombol "Unduh ringkasan (CSV)" yang benar-benar mengunduh.

TAHAP 3: Antarmuka teknisi (mobile-first, lebar maksimum 430px di tengah pada desktop)
- Tugas Saya: sapaan, badge ("Tersinkron" / "Offline - data tersimpan" / "Mode lokal"), tab Baru / Dikerjakan /
  Selesai dengan jumlah, kartu tugas terurut prioritas lalu jarak (thumbnail termal, ID mono, "Zona · S · B / K",
  chip kelas, chip prioritas Tinggi/Sedang/Rendah, jarak, satu baris tindakan), status "Menunggu sinkron" bila
  ada di antrean. Keadaan kosong yang menjelaskan bahwa tugas muncul setelah operator menyetujui "Lapor".
  Bilah tab bawah: Tugas, Peta, Pindai QR, Pesan (lencana belum dibaca), Profil.
- Detail Temuan (/teknisi/tugas/:panelId): tombol kembali, ID, chip kelas; gambar "RGB" dan "Termal IR";
  String, "Baris / Kolom", "Kelas kerusakan", "Skor IEC", "Keyakinan model"; pratinjau peta dan tombol
  "Buka Navigasi ke Panel" (tautan Google Maps directions ke koordinat panel, tab baru);
  "Tindak Lanjut": pilihan "Tindakan yang dilakukan" (Bersihkan manual, Ganti panel, Cek sambungan,
  Pangkas vegetasi), catatan, "Tambah foto bukti" (input file, pratinjau lokal saja), kotak centang
  "Daftar periksa keselamatan selesai", tautan "Salah deteksi / masalah tidak ditemukan", tombol tetap
  "Tandai Selesai" (nonaktif sampai kotak dicentang). Interaksi pertama mengubah status ke "dikerjakan".
- Pesan: daftar notifikasi (judul "Prioritas {P}: {ID}", isi "{Kelas} · {jarak} m · {tindakan}") yang membuka
  detail. Toast di dalam aplikasi saat tugas baru masuk (bandingkan ID tugas yang sudah dikenal).
- Profil: tombol "Aktifkan notifikasi" (enablePush, harus dari klik), status izin, petunjuk iPhone
  ("tambahkan ke Layar Utama dulu"), tombol "Pasang aplikasi" (beforeinstallprompt), tombol
  "Kirim notifikasi uji" (store.sendTestNotification), info mode.
- Pindai QR: sementara kolom ketik ID panel + tombol "Buka" (kamera belum diimplementasi, katakan terus terang).
- Peta: tautan ke lokasi PLTS di Google Maps.

TAHAP 4: Verifikasi
- `npm run typecheck` dan `npm run build` harus bersih.
- Uji mode lokal: `npm run dev`, buka dua tab (operator dan teknisi), setujui baris Lapor di tab operator,
  pastikan tugas muncul di tab teknisi, selesaikan tugas, cek Laporan dan CSV. Uji "Simulasi offline":
  aksi tertahan lalu tersinkron saat dimatikan.
- Uji responsif pada lebar 360, 768, 1280, dan 1920 (tanpa scroll horizontal). Uji navigasi keyboard.
- Tulis hasil uji dan batasannya ke docs/PENGUJIAN.md. Jujur tentang yang tidak bisa kamu uji.

TAHAP 5: Deploy bersama saya (tanya dulu di tiap langkah)
Pandu saya: membuat proyek Supabase dan menjalankan supabase/schema.sql, `npm run vapid`, mengisi env
di Vercel (lihat .env.example), membuat bot Telegram lewat BotFather dan mengambil chat id,
`git init` lalu push ke GitHub, impor ke Vercel, uji push di Android dan di iPhone (PWA dari Layar Utama).
Perbarui README.md dengan langkah-langkah final dan cara memecahkan masalah umum.

BATASAN
- Jangan menambah klaim yang tidak ada. Pertahankan label "Data ilustratif".
- Jangan memakai library UI pihak ketiga. Pertahankan struktur src/lib yang ada; ubah hanya bila perlu
  dan jelaskan alasannya.
- Setelah tiap tahap, ringkas apa yang selesai dan apa yang belum.
```
