import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type ColorMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';

import { StepNode } from './nodes/step-node';
import { BatchGroupNode } from './nodes/batch-group-node';
import { SubWorkflowGroupNode } from './nodes/sub-workflow-group-node';

const nodeTypes = {
  stepNode: StepNode,
  batchGroup: BatchGroupNode,
  subWorkflowGroup: SubWorkflowGroupNode,
};

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onSelectStep: (id: string, subWorkflowPath?: string) => void;
  onDeselectAll: () => void;
}

function WorkflowCanvasInner({
  nodes: externalNodes,
  edges: externalEdges,
  onSelectStep,
  onDeselectAll,
}: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(externalNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(externalEdges);
  const { fitView } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const colorMode: ColorMode = resolvedTheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    setNodes(externalNodes);
    setEdges(externalEdges);
    setTimeout(() => fitView({ padding: 0.3 }), 50);
  }, [externalNodes, externalEdges, setNodes, setEdges, fitView]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.id.startsWith('step-')) {
        onSelectStep(node.id.replace('step-', ''));
      } else if (node.id.startsWith('subwf-') && node.id.includes('-step-')) {
        const parts = node.id.replace('subwf-', '').split('-step-');
        onSelectStep(parts[1], parts[0]);
      }
    },
    [onSelectStep]
  );

  const onPaneClick = useCallback(() => {
    onDeselectAll();
  }, [onDeselectAll]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      colorMode={colorMode}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls />
      <MiniMap nodeStrokeWidth={3} />
    </ReactFlow>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
