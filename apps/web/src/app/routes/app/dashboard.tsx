import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export default function DashboardRoute() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cacheInfo, setCacheInfo] = useState<string>('')

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    const start = performance.now()
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      const duration = Math.round(performance.now() - start)
      setUsers(data)
      setCacheInfo(`Fetched ${data.length} users in ${duration}ms`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      if (!res.ok) throw new Error('Failed to create user')
      setEmail('')
      setName('')
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const deleteUser = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">API + Database + Cache Test</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <Input
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={createUser} disabled={loading || !email}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          <Button onClick={fetchUsers} disabled={loading} variant="outline">
            {loading ? 'Loading...' : 'Fetch Users'}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive mb-4">Error: {error}</p>
          )}
          {cacheInfo && (
            <p className="text-muted-foreground text-sm mb-4">{cacheInfo}</p>
          )}
          {users.length === 0 ? (
            <p className="text-muted-foreground">No users yet. Create one or click Fetch Users.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.name || 'No name'} • {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteUser(user.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Click "Fetch Users" multiple times quickly. The first request hits the database,
            subsequent requests within 60 seconds should be faster (cache hit).
            Check the API logs to see cache hits/misses.
          </p>
          <Button onClick={fetchUsers} disabled={loading}>
            Fetch Users (Check Cache)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
