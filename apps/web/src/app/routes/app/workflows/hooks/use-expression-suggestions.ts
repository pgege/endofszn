import { useMemo } from 'react';
import type { WorkflowDefinition } from '@/types/workflow';
import type { ExpressionSuggestion } from '../components/expression-input';

function buildExpressionSuggestions(
  workflow: WorkflowDefinition,
  currentStepId?: string
): ExpressionSuggestion[] {
  const suggestions: ExpressionSuggestion[] = [];

  suggestions.push({
    label: 'trigger.message',
    value: 'trigger.message',
    description: 'Trigger input message',
    category: 'Trigger',
  });

  for (const step of workflow.steps) {
    if (step.id === currentStepId) continue;
    suggestions.push(
      {
        label: `steps.${step.id}.output`,
        value: `steps.${step.id}.output`,
        description: 'Step output (typed: string, object, or array)',
        category: 'Steps',
      },
      {
        label: `steps.${step.id}.status`,
        value: `steps.${step.id}.status`,
        description: 'Step status',
        category: 'Steps',
      }
    );
  }

  if (workflow.variables) {
    for (const key of Object.keys(workflow.variables)) {
      suggestions.push({
        label: `variables.${key}`,
        value: `variables.${key}`,
        description: 'Workflow variable',
        category: 'Variables',
      });
    }
  }

  const contextKeys = new Set<string>();
  for (const agent of Object.values(workflow.agents)) {
    if (agent.context_writes) {
      for (const key of Object.keys(agent.context_writes)) {
        contextKeys.add(key);
      }
    }
  }
  for (const key of contextKeys) {
    suggestions.push({
      label: `context.${key}`,
      value: `context.${key}`,
      description: 'Shared context',
      category: 'Context',
    });
  }

  const builtins: Array<{ name: string; desc: string }> = [
    { name: 'length()', desc: 'Get length of string/array' },
    { name: 'join()', desc: 'Join array elements' },
    { name: 'contains()', desc: 'Check if string/array contains value' },
    { name: 'toJSON()', desc: 'Serialize to JSON' },
    { name: 'fromJSON()', desc: 'Parse JSON string' },
    { name: 'upper()', desc: 'Uppercase string' },
    { name: 'lower()', desc: 'Lowercase string' },
    { name: 'startsWith()', desc: 'Check string prefix' },
    { name: 'endsWith()', desc: 'Check string suffix' },
  ];
  for (const fn of builtins) {
    suggestions.push({
      label: fn.name,
      value: fn.name,
      description: fn.desc,
      category: 'Functions',
    });
  }

  return suggestions;
}

export function useExpressionSuggestions(workflow: WorkflowDefinition) {
  return useMemo(() => buildExpressionSuggestions(workflow), [workflow]);
}
