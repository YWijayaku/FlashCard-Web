export const MAX_IMAGE_WIDTH = 1200
export const IMAGE_QUALITY = 0.8

/** Hitung ukuran baru dengan lebar maksimum, menjaga rasio. */
export function fitWidth(width: number, height: number, maxWidth = MAX_IMAGE_WIDTH): { width: number; height: number } {
  if (width <= maxWidth) return { width, height }
  return { width: maxWidth, height: Math.round((height * maxWidth) / width) }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Kompres gambar ke lebar maks 1200px, WebP (fallback JPEG) kualitas ~0.8. */
export async function compressImage(file: Blob): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('File bukan gambar')
  const bitmap = await createImageBitmap(file)
  const { width, height } = fitWidth(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak didukung')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const webp = await canvasToBlob(canvas, 'image/webp', IMAGE_QUALITY)
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await canvasToBlob(canvas, 'image/jpeg', IMAGE_QUALITY)
  if (!jpeg) throw new Error('Gagal mengompres gambar')
  return jpeg
}

/** Ambil file gambar pertama dari DataTransfer (paste/drop). */
export function firstImageFile(data: DataTransfer | null): File | null {
  if (!data) return null
  for (const file of Array.from(data.files)) {
    if (file.type.startsWith('image/')) return file
  }
  return null
}
