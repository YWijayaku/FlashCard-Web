import '@testing-library/jest-dom/vitest'
import { Blob as NodeBlob } from 'node:buffer'
import 'fake-indexeddb/auto'

// Blob jsdom tidak bisa di-clone oleh fake-indexeddb (menjadi {}); pakai Blob Node
// agar gambar tersimpan utuh di IndexedDB tiruan seperti di browser asli.
globalThis.Blob = NodeBlob as unknown as typeof Blob
