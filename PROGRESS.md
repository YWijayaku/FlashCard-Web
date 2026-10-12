# PROGRESS

## Fase 1 — selesai

- [x] Setup Vite + React 18 + TS strict, Tailwind 3 + shadcn/ui, Dexie, ts-fsrs, vite-plugin-pwa, Vitest + RTL, ESLint. Script: `dev`, `build`, `lint`, `test`, `typecheck`.
- [x] Layout responsif: sidebar (≥ 1024px) berisi navigasi + daftar deck, bottom navigation di HP (Beranda, Deck, Statistik, Pengaturan), safe-area, area sentuh ≥ 44px.
- [x] Routing semua halaman: Beranda, Deck, Detail Deck, Belajar, Card Browser, Statistik, Pengaturan, Import.
- [x] Skema Dexie v1 lengkap: `decks`, `cards`, `cardStates`, `reviewLogs`, `sessions`, `settings`.
- [x] CRUD deck (nama, deskripsi, warna, ikon, tema, `newPerDay`) dan kartu 3 sisi; gambar per sisi via upload, paste, drag-drop; kompres ke lebar maks 1200px (WebP, fallback JPEG, kualitas 0.8).
- [x] Cloze sederhana: `{{...}}` → `[...]`, semua terbuka bersamaan; tipe `cloze` otomatis.
- [x] Mode Flip: pilih sisi pertanyaan & jawaban, animasi flip (hormati `prefers-reduced-motion`), 4 tombol penilaian dengan label interval, FSRS, antrian harian (semua due + kartu baru maks `newPerDay`, hari lokal), kartu learning dimasukkan kembali ke akhir antrian sesi.
- [x] Beranda: total & per deck jumlah due / baru + tombol mulai belajar.
- [x] Shortcut Flip: Spasi = balik, 1–4 = nilai (setelah dibalik), Esc = keluar; nonaktif saat fokus di input teks.
- [x] PWA: manifest, ikon (192/512/maskable/apple-touch), service worker precache → bisa dibuka offline (diuji dengan reload offline).
- [x] Seed: deck "Contoh: Ibu Kota Dunia", 10 kartu (2 cloze).
- [x] Tes unit: `lib/srs.ts`, `lib/cloze.ts`, `lib/queue.ts` (antrian harian), `lib/store.ts` + seed (fake-indexeddb), `lib/image.ts` (`fitWidth`), `lib/text.ts`, `features/study/shortcuts.ts`, `features/study/sides.ts`.

## Fase 2 — selesai

- [x] **Mode belajar**: Pilihan Ganda, Pilihan Ganda Terbalik, Typing, Match. Pemilih mode di layar setup (pilihan terakhir diingat per deck). Pilihan Ganda nonaktif dengan pesan jika deck < 4 kartu; Match memakai jumlah pasangan yang ada jika < 6.
  - PG: 4 opsi, distraktor dari deck yang sama (utamakan tipe kartu sama), benar = 3 / salah = 1. Shortcut 1–4 pilih, Spasi/Enter lanjut.
  - Typing: abaikan kapital & spasi berlebih, Levenshtein ≤ 1 (≤ 6 huruf) / ≤ 2; cloze ganda dipisah koma. Enter kirim.
  - Match: tidak memperbarui SRS, grid 12 tile, timer, waktu akhir, "Main lagi"; dicatat sebagai Session (untuk statistik waktu).
- [x] **Import** JSON/CSV: parser CSV RFC 4180 (kutip, koma & baris baru di dalam teks, BOM), validasi → preview (baris error ditandai & dilewati) → simpan ke deck baru/yang ada. Tombol "Copy prompt untuk AI".
- [x] **Backup & Restore**: `{ version, exportedAt, data }`, gambar sebagai data URL base64; restore dengan dialog "Ganti semua" / "Gabungkan".
- [x] **Card Browser**: pilih deck, cari teks di semua sisi, edit & hapus satu per satu (dimuat bertahap per 100).
- [x] **Statistik**: waktu belajar hari ini & minggu ini, jumlah review, akurasi, status kartu (baru/belajar/hafal), streak, grafik review 14 hari (Recharts, ada tampilan tabel), heatmap 12 minggu; filter per deck. Halaman di-lazy-load.
- [x] **Pengaturan**: tema sistem/terang/gelap + 5 preset warna, jam pengingat, notifikasi (izin, cek saat app dibuka, Periodic Background Sync via `public/sw-reminder.js`, badge ikon, banner di Beranda sebagai fallback), Backup & Restore.
- [x] **Ikon PWA final** + ikon maskable terpisah.
- [x] **Deck contoh 3 sisi** "Contoh: Kanji Dasar (N5)": 20 kartu (Depan = kanji, Belakang = arti, Ketiga = bacaan kun · on), 2 cloze, 5 bergambar (SVG di sisi belakang), tema "Mawar".
- [x] **GitHub Pages**: workflow `.github/workflows/pages.yml`, base path lewat `BASE_PATH`, `404.html` untuk deep link.
- [x] Tes unit baru: typing matcher, MCQ/match, sides, shortcut PG, import parser + CSV, backup (round-trip, merge), statistik (waktu, akurasi, streak, heatmap), notifikasi, pencarian, seed lanjutan. Total 86 tes.

## Keputusan penting

- **Versi dependensi**: dipilih kombinasi stabil yang saling kompatibel (Vite 6, TS 5.8, Vitest 3, Tailwind 3.4, vite-plugin-pwa 1.x, React Router 6) alih-alih major terbaru (Vite 8 / TS 7).
- **ID string** (`crypto.randomUUID()`) dan **waktu sebagai epoch ms** — memudahkan backup/restore "gabungkan" nanti.
- **`CardState.learningSteps`** ditambahkan: dibutuhkan ts-fsrs v5 untuk langkah (re)learning.
- **`ReviewLog.prevState`** ditambahkan: untuk menghitung kartu baru yang sudah diperkenalkan hari ini (kuota `newPerDay`).
- `CardState` dibuat saat kartu dibuat (state New).
- Kartu "due" = `due <= sekarang`. Kartu yang masih learning/relearning dan due sebelum pergantian hari dimasukkan kembali ke akhir antrian sesi (tanpa menunggu menitnya habis).
- Fuzz FSRS dimatikan (deterministik, mudah dites).
- Deck contoh dicatat di `Settings.seededExamples` → tidak dibuat ulang setelah dihapus (lihat fase 2).
- Komponen shadcn/ui ditulis manual mengikuti template resmi (`components.json` tersedia untuk `npx shadcn add` berikutnya).
- Tema per deck: preset warna mengubah `--primary` di halaman deck & sesi belajar.
- Dark mode mengikuti sistem secara default (`Settings.theme = 'system'`).


### Fase 2
- **Settings** ditambah field opsional `accent` (preset warna) dan `seededExamples` (deck contoh yang sudah pernah dibuat). Tidak diindeks → tidak perlu versi skema Dexie baru.
- **Deck contoh baru juga ditambahkan ke database lama** (sekali saja), karena pengguna meminta deck contoh baru; deck yang dihapus tidak dibuat ulang.
- **Waktu belajar** = jumlah `durationMs` review (maks 5 menit per kartu agar kartu yang ditinggal tidak menggelembungkan angka) + durasi sesi Match.
- **Streak** tidak putus sebelum hari berganti: jika hari ini belum belajar, dihitung sampai kemarin. Aktivitas = review + sesi Match.
- **"Hafal"** = state FSRS Review; "Belajar" = Learning/Relearning; "Baru" = New.
- **Distraktor PG** diambil dari kartu bertipe sama (basic/cloze) agar jawaban tidak bisa ditebak dari bentuknya.
- **Restore "gabungkan"**: data dengan ID sama ditimpa isi backup, pengaturan saat ini dipertahankan.
- **Pengingat** satu kali per hari, dicatat di Cache API agar app dan service worker tidak dobel.
- Tes: Blob jsdom tidak bisa di-clone fake-indexeddb, jadi `tests/setup.ts` memakai Blob Node.

## Belum dikerjakan / ide berikutnya

- Push terjadwal dari server (sesuai CLAUDE.md, ditunda ke versi berikutnya).
- Periodic Background Sync hanya jalan di Chromium untuk PWA yang di-install; browser lain memakai notifikasi saat dibuka + banner.
