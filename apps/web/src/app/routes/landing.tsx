import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/config/paths'

export default function LandingRoute() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <a href="/">
          <Logo variant="full" size="sm" />
        </a>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" asChild>
            <Link to={paths.auth.login.getHref()}>Login</Link>
          </Button>
          <Button asChild>
            <Link to={paths.auth.register.getHref()}>Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to{' '}
            <span className="text-primary">EndofSzn</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Your platform for managing the end of season. Simple, fast, and built for teams.
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Button size="lg" asChild>
              <Link to={paths.auth.register.getHref()}>Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={paths.auth.login.getHref()}>Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EndofSzn. All rights reserved.
      </footer>
    </div>
  )
}
