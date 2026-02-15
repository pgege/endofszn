import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export const mcpServerKeys = {
  all: ['mcp-servers'] as const,
}

export function useMcpServers() {
  return useQuery({
    queryKey: mcpServerKeys.all,
    queryFn: () => api.get<{ servers: string[] }>('/api/mcp/servers'),
    staleTime: 60_000,
  })
}
