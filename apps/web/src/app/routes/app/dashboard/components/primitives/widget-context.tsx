import { createContext, useContext as useReactContext, type ReactNode } from 'react'

export function createWidgetContext<T>(name: string) {
  const Context = createContext<T | null>(null)

  function Provider({ value, children }: { value: T; children: ReactNode }) {
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useContext(): T {
    const ctx = useReactContext(Context)
    if (!ctx) throw new Error(`use${name}Context must be used within ${name}Provider`)
    return ctx
  }

  return { Provider, useContext }
}
