import type { ChatAttachment } from '@/components/chat/types'

export async function uploadFile(file: File): Promise<ChatAttachment> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/chat-uploads', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
  if (!res.ok) {
    let message = 'Upload failed'
    try {
      const errorData = await res.json()
      message = errorData?.message || message
    } catch {}
    throw new Error(message)
  }
  const data = await res.json()
  return { id: data.id, url: data.url, filename: data.filename, mimeType: data.mimeType, source: 'user' }
}
