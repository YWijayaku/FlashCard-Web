# PROGRESS

## Fase 1 — selesai

- [x] Setup Vite + React 18 + TS strict, Tailwind 3 + shadcn/ui, Dexie, ts-fsrs, vite-plugin-pwa, Vitest + RTL, ESLint. Script: `dev`, `build`, `lint`, `test`, `typecheck`.
- [x] Layout responsif: sidebar (≥ 1024px) berisi navigasi + daftar deck, bottom navigation di HP (Beranda, Deck, Statistik, Pengaturan), safe-area, area sentuh ≥ 44px.
- [x] Routing semua halaman: Beranda, Deck, Detail Deck, Belajar, Card Browser\*, Statistik\*, Pengaturan\*, Import\* (\*placeholder).
- [x] Skema Dexie v1 lengkap: `decks`, `cards`, `cardStates`, `reviewLogs`, `sessions`, `settings`.
- [x] CRUD deck (nama, deskripsi, warna, ikon, tema, `newPerDay`) dan kartu 3 sisi; gambar per sisi via upload, paste, drag-drop; kompres ke lebar maks 1200px (WebP, fallback JPEG, kualitas 0.8).
- [x] Cloze sederhana: `{{...}}` → `[...]`, semua terbuka bersamaan; tipe `cloze` otomatis.
- [x] Mode Flip: pilih sisi pertanyaan & jawaban, animasi flip (hormati `prefers-reduced-motion`), 4 tombol penilaian dengan label interval, FSRS, antrian harian (semua due + kartu baru maks `newPerDay`, hari lokal), kartu learning dimasukkan kembali ke akhir antrian sesi.
- [x] Beranda: total & per deck jumlah due / baru + tombol mulai belajar.
- [x] Shortcut Flip: Spasi = balik, 1–4 = nilai (setelah dibalik), Esc = keluar; nonaktif saat fokus di input teks.
- [x] PWA: manifest, ikon placeholder (192/512/maskable/apple-touch), service worker precache → bisa dibuka offline (diuji dengan reload offline).
- [x] Seed: deck "Contoh: Ibu Kota Dunia", 10 kartu (2 cloze), hanya saat database kosong.
- [x] Tes unit: `lib/srs.ts`, `lib/cloze.ts`, `lib/queue.ts` (antrian harian), `lib/store.ts` + seed (fake-indexeddb), `lib/image.ts` (`fitWidth`), `lib/text.ts`, `features/study/shortcuts.ts`, `features/study/sides.ts`.

## Keputusan penting

- **Versi dependensi**: dipilih kombinasi stabil yang saling kompatibel (Vite 6, TS 5.8, Vitest 3, Tailwind 3.4, vite-plugin-pwa 1.x, React Router 6) alih-alih major terbaru (Vite 8 / TS 7).
- **ID string** (`crypto.randomUUID()`) dan **waktu sebagai epoch ms** — memudahkan backup/restore "gabungkan" nanti.
- **`CardState.learningSteps`** ditambahkan: dibutuhkan ts-fsrs v5 untuk langkah (re)learning.
- **`ReviewLog.prevState`** ditambahkan: untuk menghitung kartu baru yang sudah diperkenalkan hari ini (kuota `newPerDay`).
- `CardState` dibuat saat kartu dibuat (state New).
- Kartu "due" = `due <= sekarang`. Kartu yang masih learning/relearning dan due sebelum pergantian hari dimasukkan kembali ke akhir antrian sesi (tanpa menunggu menitnya habis).
- Fuzz FSRS dimatikan (deterministik, mudah dites).
- Seed hanya berjalan jika belum ada `Settings` **dan** belum ada deck → deck contoh tidak muncul lagi setelah pengguna menghapus semua deck.
- Komponen shadcn/ui ditulis manual mengikuti template resmi (`components.json` tersedia untuk `npx shadcn add` berikutnya).
- Tema per deck: preset warna mengubah `--primary` di halaman deck & sesi belajar.
- Dark mode mengikuti sistem (`Settings.theme = 'system'`); UI untuk mengubahnya menyusul di halaman Pengaturan.

## Belum dikerjakan (fase berikutnya)

- Mode Pilihan Ganda, Pilihan Ganda Terbalik, Typing, Match.
- Import JSON/CSV + preview + "Copy prompt untuk AI".
- Backup & Restore.
- Card Browser (search, edit, hapus).
- Statistik (waktu belajar, akurasi, status kartu, streak, heatmap) — Recharts belum dipasang.
- Pengaturan: tema light/dark/sistem + preset, jam pengingat, notifikasi (Periodic Background Sync, banner fallback).
- Ikon PWA final (saat ini placeholder).
