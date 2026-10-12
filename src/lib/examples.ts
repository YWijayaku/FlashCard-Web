import type { Deck } from '@/types'

export interface ExampleCard {
  front: string
  back: string
  third?: string
  /** SVG untuk gambar sisi belakang (opsional). */
  backSvg?: string
}

export interface ExampleDeck {
  key: string
  deck: Pick<Deck, 'name' | 'description' | 'color' | 'icon' | 'theme' | 'newPerDay'>
  cards: ExampleCard[]
}

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" width="320" height="200"><rect width="160" height="100" rx="12" fill="#eef2ff"/>${body}</svg>`

const MOUNTAIN = svg('<path d="M10 85 55 25l22 28 18-18 55 50Z" fill="#6366f1"/><path d="m55 25 10 13-10-4-9 6Z" fill="#fff"/>')
const RIVER = svg('<path d="M30 0c25 25-20 45 10 70s-5 30-5 30M80 0c25 25-20 45 10 70s-5 30-5 30M130 0c25 25-20 45 10 70s-5 30-5 30" fill="none" stroke="#0284c7" stroke-width="8" stroke-linecap="round"/>')
const TREE = svg('<rect x="73" y="55" width="14" height="38" rx="3" fill="#92400e"/><circle cx="80" cy="40" r="30" fill="#059669"/>')
const SUN = svg('<circle cx="80" cy="50" r="22" fill="#f59e0b"/><g stroke="#f59e0b" stroke-width="6" stroke-linecap="round"><path d="M80 8v10M80 82v10M38 50h10M112 50h10M50 20l7 7M103 73l7 7M50 80l7-7M103 27l7-7"/></g>')
const MOON = svg('<rect width="160" height="100" rx="12" fill="#1e1b4b"/><path d="M92 18a34 34 0 1 0 0 64 28 28 0 1 1 0-64Z" fill="#fde68a"/>')

export const WORLD_CAPITALS: ExampleDeck = {
  key: 'world-capitals',
  deck: {
    name: 'Contoh: Ibu Kota Dunia',
    description: 'Deck contoh. Sisi ketiga berisi wilayah. Dua kartu terakhir memakai cloze.',
    color: '#4f46e5',
    icon: '🌍',
    theme: '',
    newPerDay: 20,
  },
  cards: [
    { front: 'Ibu kota Jepang', back: 'Tokyo', third: 'Asia Timur' },
    { front: 'Ibu kota Prancis', back: 'Paris', third: 'Eropa Barat' },
    { front: 'Ibu kota Australia', back: 'Canberra', third: 'Oseania' },
    { front: 'Ibu kota Kanada', back: 'Ottawa', third: 'Amerika Utara' },
    { front: 'Ibu kota Brasil', back: 'Brasília', third: 'Amerika Selatan' },
    { front: 'Ibu kota Mesir', back: 'Kairo', third: 'Afrika Utara' },
    { front: 'Ibu kota Korea Selatan', back: 'Seoul', third: 'Asia Timur' },
    { front: 'Ibu kota Turki', back: 'Ankara', third: 'Eropa/Asia' },
    { front: 'Ibu kota Indonesia saat ini adalah {{Jakarta}}, akan dipindah ke {{Nusantara}}', back: 'Jakarta → IKN Nusantara di Kalimantan Timur' },
    { front: '{{Nairobi}} adalah ibu kota {{Kenya}}', back: 'Nairobi, Kenya (Afrika Timur)' },
  ],
}

/**
 * Deck 3 sisi: Depan = kanji, Belakang = arti, Ketiga = bacaan (kun'yomi · on'yomi).
 * Cocok untuk mencoba semua kombinasi sisi: kanji → arti, arti → kanji, kanji → bacaan.
 */
export const KANJI_BASICS: ExampleDeck = {
  key: 'kanji-n5',
  deck: {
    name: 'Contoh: Kanji Dasar (N5)',
    description:
      'Kartu 3 sisi: Depan = kanji · Belakang = arti · Ketiga = bacaan (kun · on). Coba tanya "Belakang" lalu jawab "Depan", atau tanya "Depan" dan jawab "Ketiga". Beberapa kartu bergambar dan 2 kartu cloze.',
    color: '#e11d48',
    icon: '🈶',
    theme: 'rose',
    newPerDay: 10,
  },
  cards: [
    { front: '日', back: 'matahari, hari', third: 'ひ (hi) · ニチ (nichi)', backSvg: SUN },
    { front: '月', back: 'bulan', third: 'つき (tsuki) · ゲツ (getsu)', backSvg: MOON },
    { front: '火', back: 'api', third: 'ひ (hi) · カ (ka)' },
    { front: '水', back: 'air', third: 'みず (mizu) · スイ (sui)' },
    { front: '木', back: 'pohon, kayu', third: 'き (ki) · モク (moku)', backSvg: TREE },
    { front: '金', back: 'emas, uang', third: 'かね (kane) · キン (kin)' },
    { front: '土', back: 'tanah', third: 'つち (tsuchi) · ド (do)' },
    { front: '山', back: 'gunung', third: 'やま (yama) · サン (san)', backSvg: MOUNTAIN },
    { front: '川', back: 'sungai', third: 'かわ (kawa) · セン (sen)', backSvg: RIVER },
    { front: '人', back: 'orang', third: 'ひと (hito) · ジン (jin)' },
    { front: '口', back: 'mulut', third: 'くち (kuchi) · コウ (kō)' },
    { front: '目', back: 'mata', third: 'め (me) · モク (moku)' },
    { front: '手', back: 'tangan', third: 'て (te) · シュ (shu)' },
    { front: '大', back: 'besar', third: 'おお(きい) (ōkii) · ダイ (dai)' },
    { front: '小', back: 'kecil', third: 'ちい(さい) (chiisai) · ショウ (shō)' },
    { front: '中', back: 'tengah, dalam', third: 'なか (naka) · チュウ (chū)' },
    { front: '上', back: 'atas', third: 'うえ (ue) · ジョウ (jō)' },
    { front: '下', back: 'bawah', third: 'した (shita) · カ (ka)' },
    {
      front: '日本 dibaca {{にほん}} (nihon) dan berarti {{Jepang}}',
      back: '日 (matahari) + 本 (asal) = "asal matahari"',
      third: '日本語 (nihongo) = bahasa Jepang',
    },
    {
      front: '{{月曜日}} (getsuyōbi) = hari Senin; {{金曜日}} (kin\'yōbi) = hari Jumat',
      back: '曜日 (yōbi) = hari dalam seminggu',
      third: '火曜日 Selasa · 水曜日 Rabu · 木曜日 Kamis · 土曜日 Sabtu · 日曜日 Minggu',
    },
  ],
}

/** Urutan = urutan tampil di daftar deck. */
export const EXAMPLE_DECKS: readonly ExampleDeck[] = [WORLD_CAPITALS, KANJI_BASICS]
