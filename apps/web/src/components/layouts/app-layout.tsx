import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { FloatingChat } from '@/components/chat/floating-chat'
import { useAuth } from '@/lib/auth'
import { useVendorSync } from '@/hooks/use-vendor-sync'

export function AppLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { vendor } = useAuth()
  useVendorSync(vendor?.id)

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AppHeader isChatOpen={isChatOpen} onToggleChat={() => setIsChatOpen((o) => !o)} />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        <FloatingChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </SidebarProvider>
  )
}
