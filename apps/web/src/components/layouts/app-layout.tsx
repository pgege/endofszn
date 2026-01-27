import { Outlet, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth'
import { useLogout } from '@/lib/api/auth'
import { paths } from '@/config/paths'

function AppHeader() {
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
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="px-6">
        <div className="flex h-14 items-center justify-between">
          <Link to={paths.app.root.getHref()}>
            <Logo variant="full" size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {vendor?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={logout.isPending}>
              {logout.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
