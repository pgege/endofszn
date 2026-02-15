import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type {
  WorkflowDefinition,
  SubWorkflowDefinition,
  AgentDefinition,
} from '@/types/workflow';

const STEP_W = 280;
const STEP_H = 160;
const GAP_X = 100;
const GAP_Y = 24;
const GROUP_PAD_X = 20;
const GROUP_PAD_TOP = 36;
const GROUP_PAD_BOTTOM = 16;
const START_X = 40;
const START_Y = 40;
const SUB_STEP_W = 240;
const SUB_STEP_H = 130;
const SUB_GAP_X = 80;
const SUB_GAP_Y = 20;

function buildSubWorkflowNodes(
  stepId: string,
  subDef: SubWorkflowDefinition,
  agents: Record<string, AgentDefinition>,
): { nodes: Node[]; edges: Edge[]; groupW: number; groupH: number } {
  const subSteps = subDef.steps;
  const subGraph: Record<string, Set<string>> = {};
  for (const s of subSteps) {
    subGraph[s.id] = new Set(s.needs || []);
  }

  const batches: string[][] = [];
  const completed = new Set<string>();
  const remaining = new Set(subSteps.map((s) => s.id));

  while (remaining.size > 0) {
    const batch: string[] = [];
    for (const id of remaining) {
      const deps = subGraph[id] || new Set();
      if ([...deps].every((d) => completed.has(d))) batch.push(id);
    }
    if (batch.length === 0) {
      for (const id of remaining) batch.push(id);
      remaining.clear();
    }
    for (const id of batch) {
      remaining.delete(id);
      completed.add(id);
    }
    batches.push(batch);
  }

  const groupId = `subwf-${stepId}`;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let innerX = GROUP_PAD_X;
  let maxY = 0;

  for (const batch of batches) {
    let innerY = GROUP_PAD_TOP;
    for (const sid of batch) {
      const step = subSteps.find((s) => s.id === sid)!;
      nodes.push({
        id: `subwf-${stepId}-step-${sid}`,
        type: 'stepNode',
        position: { x: innerX, y: innerY },
        parentId: groupId,
        extent: 'parent' as const,
        data: {
          step,
          agentDef: step.agent ? agents[step.agent] : undefined,
          subWorkflowPath: stepId,
        },
      });
      innerY += SUB_STEP_H + SUB_GAP_Y;
    }
    if (innerY > maxY) maxY = innerY;
    innerX += SUB_STEP_W + SUB_GAP_X;
  }

  for (const step of subSteps) {
    for (const dep of step.needs || []) {
      edges.push({
        id: `subwf-${stepId}-edge-${dep}-${step.id}`,
        source: `subwf-${stepId}-step-${dep}`,
        target: `subwf-${stepId}-step-${step.id}`,
        animated: true,
      });
    }
  }

  const groupW = innerX + GROUP_PAD_X;
  const groupH = maxY + GROUP_PAD_BOTTOM;

  return { nodes, edges, groupW, groupH };
}

function buildFlowGraph(workflow: WorkflowDefinition): {
  flowNodes: Node[];
  flowEdges: Edge[];
} {
  const steps = workflow.steps;
  const agents = workflow.agents;
  const subWorkflows = workflow.sub_workflows || {};

  const graph: Record<string, Set<string>> = {};
  for (const step of steps) {
    graph[step.id] = new Set(step.needs || []);
  }

  const batches: string[][] = [];
  const completed = new Set<string>();
  const remaining = new Set(steps.map((s) => s.id));

  while (remaining.size > 0) {
    const batch: string[] = [];
    for (const id of remaining) {
      const deps = graph[id] || new Set();
      if ([...deps].every((d) => completed.has(d))) {
        batch.push(id);
      }
    }
    if (batch.length === 0) {
      for (const id of remaining) batch.push(id);
      remaining.clear();
    }
    for (const id of batch) {
      remaining.delete(id);
      completed.add(id);
    }
    batches.push(batch);
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let x = START_X;
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const isParallel = batch.length > 1;

    if (isParallel) {
      let maxH = 0;
      for (const stepId of batch) {
        const step = steps.find((s) => s.id === stepId)!;
        const subDef = step.sub_workflow ? subWorkflows[step.sub_workflow] : undefined;
        if (subDef) {
          const { groupH } = buildSubWorkflowNodes(stepId, subDef, agents);
          if (groupH > maxH) maxH = groupH;
        } else {
          if (STEP_H > maxH) maxH = STEP_H;
        }
      }
      const innerH = batch.length * maxH + (batch.length - 1) * GAP_Y;
      const groupW = STEP_W + GROUP_PAD_X * 2;
      const groupH = innerH + GROUP_PAD_TOP + GROUP_PAD_BOTTOM;

      nodes.push({
        id: `batch-${bi}`,
        type: 'batchGroup',
        position: { x: x - GROUP_PAD_X, y: START_Y - GROUP_PAD_TOP },
        data: {
          label: `Parallel (${batch.length})`,
          stepCount: batch.length,
          width: groupW,
          height: groupH,
        },
        selectable: false,
        draggable: false,
        style: { zIndex: -1 },
      });
    }

    let y = START_Y;
    let maxWidth = STEP_W;
    for (let si = 0; si < batch.length; si++) {
      const stepId = batch[si];
      const step = steps.find((s) => s.id === stepId)!;
      const subDef = step.sub_workflow ? subWorkflows[step.sub_workflow] : undefined;

      if (subDef) {
        const { nodes: subNodes, edges: subEdges, groupW, groupH } =
          buildSubWorkflowNodes(stepId, subDef, agents);

        nodes.push({
          id: `subwf-${stepId}`,
          type: 'subWorkflowGroup',
          position: { x, y },
          data: {
            label: step.sub_workflow,
            subWorkflowName: step.sub_workflow,
            description: subDef.description,
            stepCount: subDef.steps.length,
            width: groupW,
            height: groupH,
            collapsedWidth: 260,
            collapsedHeight: 80,
          },
          style: { width: groupW, height: groupH },
        });

        nodes.push(...subNodes);
        edges.push(...subEdges);

        if (groupW > maxWidth) maxWidth = groupW;
        y += groupH + GAP_Y;
      } else {
        nodes.push({
          id: `step-${stepId}`,
          type: 'stepNode',
          position: { x, y },
          data: { step, agentDef: step.agent ? agents[step.agent] : undefined },
        });
        y += STEP_H + GAP_Y;
      }
    }
    x += maxWidth + GAP_X;
  }

  for (const step of steps) {
    for (const dep of step.needs || []) {
      const depStep = steps.find((s) => s.id === dep);
      const sourceId = depStep?.sub_workflow ? `subwf-${dep}` : `step-${dep}`;
      const targetId = step.sub_workflow ? `subwf-${step.id}` : `step-${step.id}`;

      edges.push({
        id: `edge-${dep}-${step.id}`,
        source: sourceId,
        target: targetId,
        animated: true,
      });
    }
  }

  return { flowNodes: nodes, flowEdges: edges };
}

export function useWorkflowGraph(workflow: WorkflowDefinition) {
  return useMemo(() => buildFlowGraph(workflow), [workflow]);
}
