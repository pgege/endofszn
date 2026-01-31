import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { AuthSetup } from '@/lib/auth'
import { SocketProvider } from '@/components/socket-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

type AppProviderProps = {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthSetup>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthSetup>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
