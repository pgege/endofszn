import { useState, useCallback, useRef, useMemo } from 'react';
import { stringify as yamlStringify } from 'yaml';
import type {
  WorkflowDefinition,
  SubWorkflowDefinition,
  AgentDefinition,
  WorkflowStep,
} from '@/types/workflow';
import type { Workflow } from '@/lib/api/workflows';
import { createWorkflow, updateWorkflow } from '@/lib/api/workflows';
import { examples } from '../examples';
import { useWorkflowGraph } from './use-workflow-graph';
import { useExpressionSuggestions } from './use-expression-suggestions';

const BLANK_WORKFLOW: WorkflowDefinition = {
  name: 'new-workflow',
  agents: {},
  steps: [],
  output: '',
};

export type SelectedNode =
  | { type: 'agent'; name: string }
  | { type: 'step'; id: string; subWorkflowPath?: string }
  | { type: 'subWorkflow'; name: string }
  | null;

export function useWorkflowEditor() {
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(BLANK_WORKFLOW);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml');
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const lastSavedRef = useRef<string>('');
  const workflowRef = useRef(workflow);
  workflowRef.current = workflow;

  const markDirty = useCallback(() => setIsDirty(true), []);

  const setWorkflowTracked = useCallback(
    (updater: WorkflowDefinition | ((prev: WorkflowDefinition) => WorkflowDefinition)) => {
      setWorkflow((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return next;
      });
      markDirty();
    },
    [markDirty]
  );

  const updateWorkflowField = useCallback(
    <K extends keyof WorkflowDefinition>(key: K, value: WorkflowDefinition[K]) => {
      setWorkflowTracked((prev) => ({ ...prev, [key]: value }));
    },
    [setWorkflowTracked]
  );

  const updateAgent = useCallback(
    (name: string, agent: AgentDefinition) => {
      setWorkflowTracked((prev) => ({
        ...prev,
        agents: { ...prev.agents, [name]: agent },
      }));
    },
    [setWorkflowTracked]
  );

  const addAgent = useCallback((name: string, agent: AgentDefinition) => {
    setWorkflowTracked((prev) => ({
      ...prev,
      agents: { ...prev.agents, [name]: agent },
    }));
    setSelectedNode({ type: 'agent', name });
  }, [setWorkflowTracked]);

  const removeAgent = useCallback((name: string) => {
    setWorkflowTracked((prev) => {
      const { [name]: _, ...rest } = prev.agents;
      return {
        ...prev,
        agents: rest,
        steps: prev.steps.map((s) =>
          s.agent === name ? { ...s, agent: undefined } : s
        ),
      };
    });
    setSelectedNode(null);
  }, [setWorkflowTracked]);

  const renameAgent = useCallback((oldName: string, newName: string) => {
    if (oldName === newName) return;
    setWorkflowTracked((prev) => {
      const { [oldName]: agent, ...rest } = prev.agents;
      if (!agent) return prev;
      return {
        ...prev,
        agents: { ...rest, [newName]: agent },
        steps: prev.steps.map((s) =>
          s.agent === oldName ? { ...s, agent: newName } : s
        ),
      };
    });
    setSelectedNode({ type: 'agent', name: newName });
  }, [setWorkflowTracked]);

  const updateStep = useCallback((id: string, step: WorkflowStep) => {
    setWorkflowTracked((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? step : s)),
    }));
  }, [setWorkflowTracked]);

  const addStep = useCallback((step: WorkflowStep) => {
    setWorkflowTracked((prev) => ({
      ...prev,
      steps: [...prev.steps, step],
    }));
    setSelectedNode({ type: 'step', id: step.id });
  }, [setWorkflowTracked]);

  const removeStep = useCallback((id: string) => {
    setWorkflowTracked((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((s) => s.id !== id)
        .map((s) => ({
          ...s,
          needs: s.needs?.filter((n) => n !== id),
        })),
    }));
    setSelectedNode(null);
  }, [setWorkflowTracked]);

  const renameStep = useCallback((oldId: string, newId: string) => {
    if (oldId === newId) return;
    setWorkflowTracked((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => {
        let step = s;
        if (step.id === oldId) {
          step = { ...step, id: newId };
        }
        if (step.needs?.includes(oldId)) {
          step = {
            ...step,
            needs: step.needs.map((n) => (n === oldId ? newId : n)),
          };
        }
        return step;
      }),
    }));
    setSelectedNode({ type: 'step', id: newId });
  }, [setWorkflowTracked]);

  const addSubWorkflow = useCallback((name: string, subWf: SubWorkflowDefinition) => {
    setWorkflowTracked((prev) => ({
      ...prev,
      sub_workflows: { ...(prev.sub_workflows || {}), [name]: subWf },
    }));
    setSelectedNode({ type: 'subWorkflow', name });
  }, [setWorkflowTracked]);

  const updateSubWorkflow = useCallback((name: string, subWf: SubWorkflowDefinition) => {
    setWorkflowTracked((prev) => ({
      ...prev,
      sub_workflows: { ...(prev.sub_workflows || {}), [name]: subWf },
    }));
  }, [setWorkflowTracked]);

  const removeSubWorkflow = useCallback((name: string) => {
    setWorkflowTracked((prev) => {
      const { [name]: _, ...rest } = prev.sub_workflows || {};
      return {
        ...prev,
        sub_workflows: rest,
        steps: prev.steps.map((s) =>
          s.sub_workflow === name ? { ...s, sub_workflow: undefined } : s
        ),
      };
    });
    setSelectedNode(null);
  }, [setWorkflowTracked]);

  const renameSubWorkflow = useCallback((oldName: string, newName: string) => {
    if (oldName === newName) return;
    setWorkflowTracked((prev) => {
      const subs = prev.sub_workflows || {};
      const { [oldName]: sub, ...rest } = subs;
      if (!sub) return prev;
      return {
        ...prev,
        sub_workflows: { ...rest, [newName]: sub },
        steps: prev.steps.map((s) =>
          s.sub_workflow === oldName ? { ...s, sub_workflow: newName } : s
        ),
      };
    });
    setSelectedNode({ type: 'subWorkflow', name: newName });
  }, [setWorkflowTracked]);

  const loadSavedWorkflow = useCallback((saved: Workflow) => {
    const def = structuredClone(saved.definition) as unknown as WorkflowDefinition;
    setWorkflow(def);
    setSavedWorkflowId(saved.id);
    setIsDirty(false);
    lastSavedRef.current = JSON.stringify(def);
    setSelectedNode(null);
  }, []);

  const loadTemplate = useCallback((index: number) => {
    const def = structuredClone(examples[index].workflow);
    setWorkflow(def);
    setSavedWorkflowId(null);
    setIsDirty(false);
    lastSavedRef.current = '';
    setSelectedNode(null);
  }, []);

  const newWorkflow = useCallback(() => {
    setWorkflow(BLANK_WORKFLOW);
    setSavedWorkflowId(null);
    setIsDirty(false);
    lastSavedRef.current = '';
    setSelectedNode(null);
  }, []);

  const saveWorkflow = useCallback(async (vendorId: string): Promise<Workflow | null> => {
    setIsSaving(true);
    try {
      const current = workflowRef.current;
      const def = current as unknown as Record<string, unknown>;
      if (savedWorkflowId) {
        const saved = await updateWorkflow(savedWorkflowId, {
          name: current.name,
          description: current.description,
          definition: def,
        });
        setIsDirty(false);
        lastSavedRef.current = JSON.stringify(current);
        return saved;
      } else {
        const saved = await createWorkflow({
          vendorId,
          name: current.name,
          description: current.description,
          definition: def,
        });
        setSavedWorkflowId(saved.id);
        setIsDirty(false);
        lastSavedRef.current = JSON.stringify(current);
        return saved;
      }
    } catch (e) {
      console.error('Failed to save workflow:', e);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [savedWorkflowId]);

  const saveAsWorkflow = useCallback(async (vendorId: string, name: string): Promise<Workflow | null> => {
    setIsSaving(true);
    try {
      const current = workflowRef.current;
      const updated = { ...current, name };
      const def = updated as unknown as Record<string, unknown>;
      const saved = await createWorkflow({
        vendorId,
        name,
        description: current.description,
        definition: def,
      });
      setWorkflow(updated);
      setSavedWorkflowId(saved.id);
      setIsDirty(false);
      lastSavedRef.current = JSON.stringify(updated);
      return saved;
    } catch (e) {
      console.error('Failed to save workflow as:', e);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const codeOutput = useMemo(() => {
    return format === 'yaml'
      ? yamlStringify(workflow, { lineWidth: 120 })
      : JSON.stringify(workflow, null, 2);
  }, [format, workflow]);

  const { flowNodes, flowEdges } = useWorkflowGraph(workflow);
  const expressionSuggestions = useExpressionSuggestions(workflow);

  return {
    workflow,
    setWorkflow: setWorkflowTracked,
    updateWorkflowField,
    selectedNode,
    setSelectedNode,
    format,
    setFormat,
    savedWorkflowId,
    isSaving,
    isDirty,
    updateAgent,
    addAgent,
    removeAgent,
    renameAgent,
    updateStep,
    addStep,
    removeStep,
    renameStep,
    addSubWorkflow,
    updateSubWorkflow,
    removeSubWorkflow,
    renameSubWorkflow,
    loadSavedWorkflow,
    loadTemplate,
    newWorkflow,
    saveWorkflow,
    saveAsWorkflow,
    codeOutput,
    flowNodes,
    flowEdges,
    expressionSuggestions,
  };
}
