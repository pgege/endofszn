import { useAuth } from '@/lib/auth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          You're logged in as {user?.email}
        </p>
      </div>
    </div>
  )
}
