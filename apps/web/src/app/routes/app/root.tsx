import { Link, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/config/paths'
import { cn } from '@/lib/utils'

const navItems = [
  { path: paths.app.dashboard.path, label: 'Dashboard' },
  { path: paths.app.services.path, label: 'Services' },
  { path: paths.app.profile.path, label: 'Profile' },
]

export default function AppRoot() {
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center gap-6">
            <Link to={paths.home.path} className="font-bold text-lg">
              EndofSzn
            </Link>
            <div className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-3 py-2 text-sm rounded-md transition-colors',
                    location.pathname === item.path
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
