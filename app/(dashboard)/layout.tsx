import { DashboardSidebar } from '@/components/navigation/dashboard-sidebar'
import { Header } from '@/components/navigation/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Get user from session
  const user = undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header user={user ? { email: user.email, name: user.name } : undefined} />
        <main className="flex-1 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
