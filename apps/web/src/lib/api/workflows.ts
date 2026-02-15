import { api } from '../api-client'

export interface Workflow {
  id: string
  vendorId: string
  name: string
  description?: string
  definition: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export async function getWorkflows(vendorId: string): Promise<Workflow[]> {
  return api.get<Workflow[]>('/api/workflows', { vendorId })
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return api.get<Workflow>(`/api/workflows/${id}`)
}

export async function createWorkflow(data: {
  vendorId: string
  name: string
  description?: string
  definition: Record<string, unknown>
}): Promise<Workflow> {
  return api.post<Workflow>('/api/workflows', data)
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string
    description?: string
    definition?: Record<string, unknown>
  }
): Promise<Workflow> {
  return api.put<Workflow>(`/api/workflows/${id}`, data)
}

export async function deleteWorkflow(id: string): Promise<void> {
  return api.delete(`/api/workflows/${id}`)
}
