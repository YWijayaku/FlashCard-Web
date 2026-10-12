/** Kelas ukuran teks kartu berdasarkan panjang teks: makin panjang, makin kecil. */
export function cardTextSizeClass(length: number): string {
  if (length <= 30) return 'text-3xl sm:text-4xl'
  if (length <= 80) return 'text-2xl sm:text-3xl'
  if (length <= 200) return 'text-xl sm:text-2xl'
  if (length <= 400) return 'text-lg'
  return 'text-base'
}
