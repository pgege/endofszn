import { useNavigate, Link } from 'react-router-dom'
import { FlaskConical, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth'
import { useLogout } from '@/lib/api/auth'
import { paths } from '@/config/paths'

export function AppHeader({ isChatOpen, onToggleChat }: { isChatOpen: boolean; onToggleChat: () => void }) {
  const { vendor } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        navigate(paths.auth.login.getHref(), { replace: true })
      },
    })
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur-xl">
      <div className="px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Link to={paths.app.root.getHref()}>
              <Logo variant="full" size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isChatOpen ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleChat}
              className="gap-2"
            >
              <img src="/end-of-szn-logo.png" alt="Eugene" className="size-5" />
              Eugene
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {vendor?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium leading-none">{vendor?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(paths.app.workflows.playground.getHref())}>
                  <FlaskConical className="mr-2 size-4" />
                  Playground
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={logout.isPending}>
                  <LogOut className="mr-2 size-4" />
                  {logout.isPending ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
