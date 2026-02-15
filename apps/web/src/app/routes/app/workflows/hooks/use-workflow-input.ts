import { useState, useEffect, useMemo } from 'react';
import type { WorkflowDefinition } from '@/types/workflow';

export function useWorkflowInput(workflow: WorkflowDefinition, messageCount: number) {
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'json'>('text');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const defaultToJson = useMemo(() => {
    const firstStep = workflow.steps[0];
    if (!firstStep?.agent) return false;
    const agent = workflow.agents[firstStep.agent];
    return agent?.input_schema?.type === 'object';
  }, [workflow.steps, workflow.agents]);

  useEffect(() => {
    if (defaultToJson && messageCount === 0) {
      setInputMode('json');
      if (!inputValue) {
        setInputValue('{\n  \n}');
      }
    }
  }, [defaultToJson]);

  useEffect(() => {
    if (inputMode === 'json' && inputValue) {
      try {
        JSON.parse(inputValue);
        setJsonError(null);
      } catch (e) {
        setJsonError((e as Error).message);
      }
    } else {
      setJsonError(null);
    }
  }, [inputValue, inputMode]);

  const handleModeChange = (mode: string) => {
    setInputMode(mode as 'text' | 'json');
    if (mode === 'json' && !inputValue.trim()) {
      setInputValue('{\n  \n}');
    }
    if (mode === 'text' && inputValue === '{\n  \n}') {
      setInputValue('');
    }
  };

  return {
    inputValue,
    setInputValue,
    inputMode,
    jsonError,
    handleModeChange,
  };
}
