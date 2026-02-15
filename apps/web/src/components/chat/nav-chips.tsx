import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { getRouteManifest } from '@/config/paths'

export interface NavHint {
  route_key: string
  params?: Record<string, string>
  search?: Record<string, string>
  label: string
}

const manifest = getRouteManifest()

function resolveUrl(hint: NavHint): string | null {
  const entry = manifest.find((r) => r.key === hint.route_key)
  if (!entry) {
    console.warn(`[NavChips] Unknown route_key "${hint.route_key}" — hint dropped. Available keys: ${manifest.map((r) => r.key).join(', ')}`)
    return null
  }

  let url = entry.path
  if (hint.params) {
    for (const [key, value] of Object.entries(hint.params)) {
      url = url.replace(`:${key}`, encodeURIComponent(value))
    }
  }

  if (url.includes(':')) {
    console.warn(`[NavChips] Unresolved params in route "${hint.route_key}" — url "${url}" still contains placeholders. Provided params: ${JSON.stringify(hint.params)}`)
    return null
  }

  if (hint.search) {
    const entries = Object.entries(hint.search).filter(([, v]) => v)
    if (entries.length > 0) {
      url += '?' + new URLSearchParams(entries).toString()
    }
  }

  return url
}

interface NavChipsProps {
  hints: NavHint[]
}

export function NavChips({ hints }: NavChipsProps) {
  if (!hints || hints.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {hints.map((hint, i) => {
        const url = resolveUrl(hint)
        if (!url) return null

        return (
          <Link
            key={`${hint.route_key}-${i}`}
            to={url}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
          >
            <ExternalLink className="h-3 w-3" />
            {hint.label}
          </Link>
        )
      })}
    </div>
  )
}
