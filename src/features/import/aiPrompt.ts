/** Template prompt agar AI apa pun bisa membuat file import untuk aplikasi ini. */
export const AI_IMPORT_PROMPT = `Buatkan flashcard dalam format JSON berikut (tanpa penjelasan lain, hanya JSON yang valid):

{
  "deck": "Nama deck",
  "description": "Deskripsi singkat (opsional)",
  "cards": [
    { "front": "pertanyaan / istilah", "back": "jawaban / arti", "third": "info tambahan (opsional)" }
  ]
}

Aturan:
- "front" dan "back" wajib diisi; "third" opsional (misal: cara baca, contoh kalimat, kategori).
- Untuk kartu isian (cloze), tulis bagian yang disembunyikan dengan kurung kurawal ganda di "front", contoh: "Ibu kota Jepang adalah {{Tokyo}}". Pada kartu cloze, "back" boleh kosong.
- Jangan pakai Markdown, LaTeX, atau HTML; teks biasa saja.
- Satu fakta per kartu, singkat dan jelas.

Topik: [TULIS TOPIK DI SINI]
Jumlah kartu: [MISAL 20]
Bahasa: Indonesia`
