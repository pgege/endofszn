import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { paths } from '@/config/paths'

export default function NotFoundRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Button asChild>
          <Link to={paths.home.getHref()}>Go Home</Link>
        </Button>
      </div>
    </div>
  )
}
