import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <Button asChild className="mt-6">
        <Link to="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  )
}
