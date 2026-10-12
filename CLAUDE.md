# CLAUDE.md — Flashcard App

Panduan proyek untuk Claude. Baca file ini sepenuhnya sebelum mengerjakan tugas apa pun.

## Ringkasan proyek
Web app flashcard dengan spaced repetition. **Offline-first**, **web-first**, dan **responsif optimal di HP**.
Tidak ada backend dan tidak ada login. Semua data disimpan di browser (IndexedDB).

## Tech stack (wajib, jangan diganti tanpa izin)
- Vite + React 18 + TypeScript (strict)
- React Router
- Tailwind CSS + shadcn/ui
- Dexie.js (IndexedDB) + `dexie-react-hooks`
- `ts-fsrs` untuk spaced repetition
- Recharts untuk grafik
- `vite-plugin-pwa` (Workbox) untuk PWA & offline
- Vitest + React Testing Library untuk tes
- Package manager: npm

## Perintah
- `npm run dev` — server lokal
- `npm run build` — build produksi (WAJIB lolos sebelum commit akhir)
- `npm run lint` — ESLint
- `npm run test` — Vitest (mode run, bukan watch)
- `npm run typecheck` — `tsc --noEmit`

## Struktur folder
```
src/
  app/            # routing & layout (AppShell, Sidebar, BottomNav)
  pages/          # Home, Decks, DeckDetail, Study, Browser, Stats, Settings, Import
  components/     # komponen UI (Card, RatingButtons, DeckForm, CardForm, ...)
  components/ui/  # komponen shadcn/ui
  features/
    study/        # mode belajar: flip, mcq, mcq-reverse, typing, match
    import/       # parser JSON/CSV + validasi
    backup/       # export & restore
    stats/        # perhitungan statistik, streak, heatmap
  lib/
    db.ts         # skema Dexie
    srs.ts        # wrapper ts-fsrs + antrian harian
    cloze.ts      # parsing {{...}}
    image.ts      # kompres gambar
    notify.ts     # notifikasi
  hooks/
  types/
tests/            # tes unit (atau *.test.ts di samping file)
```

## Model data (Dexie)
```ts
Deck      { id, name, description, color, icon, theme, newPerDay /*default 20*/, createdAt }
Card      { id, deckId, front, back, third?, frontImage?: Blob, backImage?: Blob, thirdImage?: Blob,
            type: 'basic' | 'cloze', createdAt, updatedAt }
CardState { cardId, due, stability, difficulty, elapsedDays, scheduledDays, reps, lapses, state, lastReview? }
ReviewLog { id, cardId, deckId, rating /*1-4*/, mode, durationMs, reviewedAt }
Session   { id, deckId, mode, startedAt, endedAt, cardsStudied, correct }
Settings  { id: 'app', theme, reminderTime, notificationsEnabled }
```
- Gambar disimpan sebagai Blob, dikompres ke lebar maks 1200px (JPEG/WebP kualitas ~0.8).
- Gunakan versi skema Dexie (`db.version(n)`) dan migrasi jika skema berubah.

## Fitur dan aturannya

### Deck & kartu
- CRUD deck: nama, deskripsi, warna, ikon, tema, `newPerDay`.
- Kartu 3 sisi: `front`, `back`, `third` (opsional). Tiap sisi bisa diberi gambar (upload, paste, drag-drop).
- Sebelum sesi, pengguna memilih sisi yang ditanyakan dan sisi jawaban.

### Cloze (sederhana)
- `{{jawaban}}` di `front` → tampil `[...]` saat ditanya, terbuka saat dibalik.
- Semua cloze dalam satu kartu dibuka bersamaan. Tidak membuat kartu terpisah per cloze.
- Kartu bertipe `cloze` otomatis jika `front` mengandung `{{...}}`.

### Penilaian & spaced repetition
- Tombol: Tidak hafal (1) / Ragu (2) / Hafal (3) / Sangat hafal (4) → rating FSRS Again/Hard/Good/Easy.
- Setiap tombol menampilkan interval berikutnya (misal "3 hari").
- Antrian harian: semua kartu due + kartu baru maks `newPerDay` per deck per hari. Review tidak dibatasi.
- "Hari" dihitung berdasarkan zona waktu lokal pengguna.

### Mode belajar
| Mode | Memperbarui SRS? | Catatan |
|---|---|---|
| Flip | Ya | 4 tombol penilaian |
| Pilihan Ganda | Ya (benar=3, salah=1) | 4 opsi, distraktor dari deck yang sama |
| Pilihan Ganda Terbalik | Ya (benar=3, salah=1) | jawaban ditampilkan, pilih term |
| Typing | Ya (benar=3, salah=1) | abaikan kapital & spasi berlebih, toleransi typo kecil (Levenshtein ≤ 1 untuk jawaban ≤ 6 huruf, ≤ 2 untuk lebih panjang) |
| Match (minimal) | Tidak | 6 pasang dalam grid, tap untuk menjodohkan, timer, tampilkan waktu akhir |

- Deck dengan kurang dari 4 kartu: nonaktifkan Pilihan Ganda dengan pesan yang jelas. Kurang dari 6: Match memakai jumlah yang ada.

### Import
- JSON: `{ "deck": string, "description"?: string, "cards": [{ "front", "back", "third"? }] }`
- CSV: kolom `front,back,third` (header wajib, mendukung tanda kutip dan koma di dalam teks).
- Validasi → halaman preview (baris error ditandai) → konfirmasi → simpan.
- Tombol "Copy prompt untuk AI" berisi template agar AI apa pun bisa membuat file import.

### Backup & Restore
- Export seluruh data (gambar sebagai base64) ke satu file JSON berversi (`{ version, exportedAt, data }`).
- Restore dengan konfirmasi; pilihan "ganti semua" atau "gabungkan".

### Card Browser (sederhana)
- Daftar kartu per deck, search teks, edit dan hapus satu per satu. Tidak ada filter lanjutan atau edit massal.

### Statistik (minimal)
- Waktu belajar hari ini & minggu ini, jumlah review, akurasi.
- Jumlah kartu per status: baru / belajar / hafal.
- Streak hari berturut-turut + heatmap aktivitas 12 minggu.

### Notifikasi
- Pengaturan jam pengingat harian.
- Tanpa backend, jadi: tampilkan notifikasi saat app dibuka jika ada kartu due; gunakan Periodic Background Sync jika browser mendukung; fallback berupa badge/banner di dalam app.
- Push terjadwal dari server ditunda ke versi berikutnya.

### Tema
- Light/dark (ikut sistem secara default) + beberapa preset warna. Deck bisa memiliki tema sendiri.

### Shortcut keyboard
- Spasi = balik kartu · 1–4 = nilai / pilih opsi · Enter = kirim jawaban Typing · Esc = keluar sesi.
- Shortcut tidak aktif saat fokus berada di input teks (kecuali Enter di Typing).

## Aturan UI & responsif
- Mobile-first. Uji di lebar 375px dan 1280px.
- Desktop (≥ 1024px): sidebar daftar deck kiri + konten kanan.
- HP: bottom navigation (Beranda, Deck, Statistik, Pengaturan); tombol penilaian besar di bawah layar (zona jempol); tap kartu untuk membalik.
- Area sentuh minimal 44px. Tidak ada scroll horizontal. Hormati `safe-area-inset` (notch iPhone).
- Teks kartu panjang mengecil otomatis; gambar maks selebar kontainer.
- Animasi flip halus, hormati `prefers-reduced-motion`.
- Aksesibilitas dasar: label pada tombol ikon, kontras cukup, fokus terlihat.
- Bahasa UI: Indonesia.

## Di luar ruang lingkup (JANGAN dibuat)
Tag, TTS/audio, undo, leech detection, login/sinkronisasi, share deck, Markdown/LaTeX, generate kartu AI di dalam app, backend/server.

## Standar kode
- TypeScript strict, hindari `any`.
- Logika murni (srs, cloze, import parser, typing matcher, streak) dipisah dari UI dan **wajib punya tes unit**.
- Komponen kecil dan fokus; hindari file > 300 baris.
- Tidak ada `console.log` tertinggal.

## Cara kerja Claude di repo ini
1. Sebelum menulis kode, tulis rencana singkat (file yang akan dibuat/diubah).
2. Kerjakan bertahap dan commit per langkah logis dengan pesan Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`).
3. Sebelum selesai, jalankan `npm run typecheck && npm run lint && npm run test && npm run build`. Perbaiki semua error.
4. Perbarui `PROGRESS.md`: apa yang sudah selesai, keputusan penting, dan hal yang belum.
5. Buka Pull Request dengan ringkasan, daftar fitur, dan checklist tes manual (termasuk di HP 375px).
6. Jika ada keputusan besar yang ambigu, pilih opsi paling sederhana yang sesuai dokumen ini dan catat di PR.
