import { useState, useCallback } from 'react'

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const set = useCallback((value: T) => {
    setState(value)
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key])

  return [state, set]
}
