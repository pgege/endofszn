import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  createWorkflowRun,
  getWorkflowRuns,
  getWorkflowRun,
  deleteWorkflowRun,
  type WorkflowRun,
} from '@/lib/api/workflow-runs';
import type { ChatMessage, ChatAttachment } from '@/components/chat/types';

interface SessionRun {
  id: string;
  createdAt: string;
  preview: string;
}

export function useWorkflowRuns(savedWorkflowId: string | null) {
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [pastRuns, setPastRuns] = useState<WorkflowRun[]>([]);
  const [sessionRuns, setSessionRuns] = useState<SessionRun[]>([]);
  const { vendor } = useAuth();
  const pendingMessageRef = useRef<{ content: string; context: Record<string, unknown>; attachments?: ChatAttachment[] } | null>(null);
  const prevSavedWorkflowIdRef = useRef<string | null>(savedWorkflowId);

  const needsReset = prevSavedWorkflowIdRef.current !== savedWorkflowId;
  if (needsReset) {
    prevSavedWorkflowIdRef.current = savedWorkflowId;
  }

  useEffect(() => {
    if (needsReset) {
      setWorkflowRunId(null);
      setSessionRuns([]);
    }
    if (!savedWorkflowId || !vendor?.id) {
      setPastRuns([]);
      return;
    }
    getWorkflowRuns(vendor.id, savedWorkflowId).then(setPastRuns).catch(() => {});
  }, [savedWorkflowId, vendor?.id, needsReset]);

  const refreshRuns = useCallback(() => {
    if (!savedWorkflowId || !vendor?.id) return;
    getWorkflowRuns(vendor.id, savedWorkflowId).then(setPastRuns).catch(() => {});
  }, [savedWorkflowId, vendor?.id]);

  const loadPastRun = useCallback(async (runId: string): Promise<ChatMessage[] | null> => {
    try {
      const run = await getWorkflowRun(runId);
      setWorkflowRunId(runId);
      if (run.messages && run.messages.length > 0) {
        return run.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          type: m.type,
          content: m.content,
          data: m.data,
          attachments: m.attachments?.map((a) => ({
            id: a.id,
            url: a.url,
            filename: a.filename,
            mimeType: a.mimeType,
            source: a.source,
          })),
          timestamp: m.createdAt,
        }));
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const handleNewRun = useCallback(() => {
    setWorkflowRunId(null);
  }, []);

  const handleDeleteRun = useCallback(async (runId: string) => {
    try {
      await deleteWorkflowRun(runId);
      if (workflowRunId === runId) {
        setWorkflowRunId(null);
      }
      setPastRuns((prev) => prev.filter((r) => r.id !== runId));
      setSessionRuns((prev) => prev.filter((r) => r.id !== runId));
    } catch {
      // ignore
    }
  }, [workflowRunId]);

  const startRun = useCallback(async (content: string, context: Record<string, unknown>, attachments?: ChatAttachment[]): Promise<boolean> => {
    if (!vendor) return false;
    try {
      const run = await createWorkflowRun(vendor.id, savedWorkflowId ?? undefined);
      pendingMessageRef.current = { content, context, attachments };
      setWorkflowRunId(run.id);
      setSessionRuns((prev) => [
        { id: run.id, createdAt: run.createdAt, preview: content.slice(0, 40) },
        ...prev,
      ]);
      refreshRuns();
      return true;
    } catch {
      return false;
    }
  }, [vendor, savedWorkflowId, refreshRuns]);

  const consumePendingMessage = useCallback((): { content: string; context: Record<string, unknown>; attachments?: ChatAttachment[] } | null => {
    const pending = pendingMessageRef.current;
    pendingMessageRef.current = null;
    return pending;
  }, []);

  const allRuns = savedWorkflowId
    ? pastRuns
    : sessionRuns.map((r) => ({
        id: r.id,
        vendorId: '',
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
        messages: [{ id: '', workflowRunId: r.id, role: 'user' as const, type: 'user_message', content: r.preview, createdAt: r.createdAt }],
      }));

  return {
    workflowRunId,
    setWorkflowRunId,
    allRuns,
    needsReset,
    loadPastRun,
    handleNewRun,
    handleDeleteRun,
    startRun,
    consumePendingMessage,
  };
}
