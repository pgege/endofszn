import { api } from '../api-client'

export interface WorkflowRun {
  id: string
  vendorId: string
  workflowId?: string
  title?: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

export interface MessageAttachment {
  id: string
  url: string
  filename: string
  mimeType: string
  source: 'user' | 'agent'
}

export interface Message {
  id: string
  workflowRunId: string
  role: 'user' | 'assistant'
  type: string
  content: string
  data?: Record<string, unknown>
  attachments?: MessageAttachment[]
  createdAt: string
}

export async function createWorkflowRun(
  vendorId: string,
  workflowId?: string
): Promise<WorkflowRun> {
  return api.post<WorkflowRun>('/api/workflow-runs', { vendorId, workflowId })
}

export async function getWorkflowRuns(
  vendorId: string,
  workflowId?: string
): Promise<WorkflowRun[]> {
  const params: Record<string, string> = { vendorId }
  if (workflowId) params.workflowId = workflowId
  return api.get<WorkflowRun[]>('/api/workflow-runs', params)
}

export async function getWorkflowRun(id: string): Promise<WorkflowRun> {
  return api.get<WorkflowRun>(`/api/workflow-runs/${id}`)
}

export async function updateWorkflowRunTitle(id: string, title: string): Promise<WorkflowRun> {
  return api.patch<WorkflowRun>(`/api/workflow-runs/${id}/title`, { title })
}

export async function deleteWorkflowRun(id: string): Promise<void> {
  return api.delete(`/api/workflow-runs/${id}`)
}
