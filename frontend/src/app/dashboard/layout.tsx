import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
