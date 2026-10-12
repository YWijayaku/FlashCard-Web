import type { Card, CardSide } from '@/types'

export const SIDE_LABELS: Record<CardSide, string> = {
  front: 'Depan',
  back: 'Belakang',
  third: 'Ketiga',
}

export interface SideView {
  text: string
  image?: Blob
  cloze?: 'masked' | 'revealed'
}

function rawSide(card: Card, side: CardSide): { text: string; image?: Blob } {
  if (side === 'front') return { text: card.front, image: card.frontImage }
  if (side === 'back') return { text: card.back, image: card.backImage }
  return { text: card.third ?? '', image: card.thirdImage }
}

export function hasSideContent(card: Card, side: CardSide): boolean {
  const { text, image } = rawSide(card, side)
  return text.trim().length > 0 || image !== undefined
}

/** Sisi yang tersedia di deck: Depan & Belakang selalu, Ketiga jika ada kartu yang memilikinya. */
export function availableSides(cards: readonly Card[]): CardSide[] {
  const sides: CardSide[] = ['front', 'back']
  if (cards.some((c) => hasSideContent(c, 'third'))) sides.push('third')
  return sides
}

/** Tampilan sisi pertanyaan: cloze di sisi depan disembunyikan dengan [...]. */
export function questionView(card: Card, side: CardSide): SideView {
  const raw = rawSide(card, side)
  if (card.type === 'cloze' && side === 'front') return { ...raw, cloze: 'masked' }
  return raw
}

/**
 * Tampilan jawaban. Untuk kartu cloze, sisi depan ditampilkan dengan semua cloze terbuka;
 * jika ditanya dari sisi depan, sisi jawaban (bila ada) menjadi catatan tambahan.
 */
export function answerViews(card: Card, question: CardSide, answer: CardSide): SideView[] {
  if (card.type === 'cloze' && (question === 'front' || answer === 'front')) {
    const views: SideView[] = [{ text: card.front, image: card.frontImage, cloze: 'revealed' }]
    if (question === 'front' && answer !== 'front' && hasSideContent(card, answer)) views.push(rawSide(card, answer))
    return views
  }
  return [rawSide(card, answer)]
}
