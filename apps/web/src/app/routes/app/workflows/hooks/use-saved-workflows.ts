import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getWorkflows,
  deleteWorkflow,
  type Workflow,
} from '@/lib/api/workflows';

export function useSavedWorkflows(
  savedWorkflowId: string | null,
  loadSavedWorkflow: (wf: Workflow) => void,
  newWorkflow: () => void,
  saveWorkflow: (vendorId: string) => Promise<Workflow | null>,
  saveAsWorkflow: (vendorId: string, name: string) => Promise<Workflow | null>,
) {
  const { vendor } = useAuth();
  const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
  const hasAutoLoaded = useRef(false);

  useEffect(() => {
    if (!vendor?.id) return;
    getWorkflows(vendor.id)
      .then((wfs) => {
        setSavedWorkflows(wfs);
        if (!hasAutoLoaded.current && wfs.length > 0) {
          hasAutoLoaded.current = true;
          loadSavedWorkflow(wfs[0]);
        }
      })
      .catch(() => {});
  }, [vendor?.id]);

  const refreshWorkflows = useCallback(() => {
    if (!vendor?.id) return;
    getWorkflows(vendor.id).then(setSavedWorkflows).catch(() => {});
  }, [vendor?.id]);

  const handleSave = useCallback(async () => {
    if (!vendor?.id) return null;
    const result = await saveWorkflow(vendor.id);
    if (result) refreshWorkflows();
    return result;
  }, [vendor?.id, saveWorkflow, refreshWorkflows]);

  const handleSaveAs = useCallback(async (name: string) => {
    if (!vendor?.id) return null;
    const result = await saveAsWorkflow(vendor.id, name);
    if (result) refreshWorkflows();
    return result;
  }, [vendor?.id, saveAsWorkflow, refreshWorkflows]);

  const handleDeleteWorkflow = useCallback(async (id: string) => {
    try {
      await deleteWorkflow(id);
      if (savedWorkflowId === id) newWorkflow();
      refreshWorkflows();
    } catch {
      // ignore
    }
  }, [savedWorkflowId, newWorkflow, refreshWorkflows]);

  return {
    savedWorkflows,
    handleSave,
    handleSaveAs,
    handleDeleteWorkflow,
  };
}
