import { AppSidebar } from '@/components/layout/AppSidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SystemStatus } from '@/components/system/SystemStatus'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar />
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      <BottomNav />
      <SystemStatus />
    </div>
  )
}
