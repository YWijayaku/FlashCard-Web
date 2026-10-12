import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-safe lg:pb-0">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
