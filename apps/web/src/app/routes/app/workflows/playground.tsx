import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { DragResizeHandle } from './components/drag-resize-handle';
import { useWorkflowEditor } from './hooks/use-workflow-editor';
import { useSavedWorkflows } from './hooks/use-saved-workflows';
import { WorkflowCanvas } from './components/workflow-canvas';
import { CodePreview } from './components/code-preview';
import { ExecutionPanel } from './components/execution-panel';
import { Toolbar } from './components/toolbar';
import { AgentsBar } from './components/agents-bar';
import { WorkflowConfigSheet } from './components/workflow-config-sheet';
import { AgentConfigSheet } from './components/agent-config-sheet';
import { StepConfigSheet } from './components/step-config-sheet';
import { SubWorkflowConfigSheet } from './components/sub-workflow-config-sheet';

export default function PlaygroundPage() {
  const {
    workflow,
    setWorkflow,
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
  } = useWorkflowEditor();

  const { savedWorkflows, handleSave, handleSaveAs, handleDeleteWorkflow } = useSavedWorkflows(
    savedWorkflowId, loadSavedWorkflow, newWorkflow, saveWorkflow, saveAsWorkflow
  );

  const [searchParams] = useSearchParams();
  const [configOpen, setConfigOpen] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(300);

  useEffect(() => {
    const workflowParam = searchParams.get('workflow');
    if (workflowParam && !savedWorkflowId) {
      loadSavedWorkflow(workflowParam);
    }
  }, [searchParams, savedWorkflowId, loadSavedWorkflow]);

  const handleNameChange = useCallback(
    (name: string) => {
      updateWorkflowField('name', name);
    },
    [updateWorkflowField]
  );

  const selectedAgent =
    selectedNode?.type === 'agent' ? workflow.agents[selectedNode.name] : null;
  const selectedStep = useMemo(() => {
    if (selectedNode?.type !== 'step') return null;
    if (selectedNode.subWorkflowPath) {
      const subWf = workflow.sub_workflows?.[selectedNode.subWorkflowPath];
      return subWf?.steps.find((s) => s.id === selectedNode.id) ?? null;
    }
    return workflow.steps.find((s) => s.id === selectedNode.id) ?? null;
  }, [selectedNode, workflow]);
  const selectedSubWorkflow =
    selectedNode?.type === 'subWorkflow' ? workflow.sub_workflows?.[selectedNode.name] : null;

  const allAgentNames = Object.keys(workflow.agents);
  const allStepIds = workflow.steps.map((s) => s.id);
  const allSubWorkflowNames = Object.keys(workflow.sub_workflows || {});

  const contextKeySuggestions = useMemo(() => {
    const keys = new Set<string>();
    for (const agent of Object.values(workflow.agents)) {
      if (agent.context_writes) {
        for (const key of Object.keys(agent.context_writes)) {
          keys.add(key);
        }
      }
    }
    return Array.from(keys);
  }, [workflow.agents]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Toolbar
        onLoadTemplate={loadTemplate}
        onLoadSavedWorkflow={loadSavedWorkflow}
        onNewWorkflow={newWorkflow}
        onOpenConfig={() => setConfigOpen(true)}
        onAddStep={addStep}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        isSaving={isSaving}
        isDirty={isDirty}
        savedWorkflowId={savedWorkflowId}
        workflowName={workflow.name}
        onNameChange={handleNameChange}
        existingStepIds={allStepIds}
        agentNames={allAgentNames}
        savedWorkflows={savedWorkflows}
        onDeleteWorkflow={handleDeleteWorkflow}
      />

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col">
              <AgentsBar
                agents={workflow.agents}
                subWorkflows={workflow.sub_workflows}
                onSelectAgent={(name) =>
                  setSelectedNode({ type: 'agent', name })
                }
                onAddAgent={addAgent}
                onRemoveAgent={removeAgent}
                onSelectSubWorkflow={(name) =>
                  setSelectedNode({ type: 'subWorkflow', name })
                }
                onAddSubWorkflow={addSubWorkflow}
                onRemoveSubWorkflow={removeSubWorkflow}
              />
              <div className="flex-1 min-h-0">
                <WorkflowCanvas
                  nodes={flowNodes}
                  edges={flowEdges}
                  onSelectStep={(id, subWorkflowPath) =>
                    setSelectedNode({ type: 'step', id, subWorkflowPath })
                  }
                  onDeselectAll={() => setSelectedNode(null)}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="h-full flex flex-col">
              <div className="shrink-0 flex flex-col" style={{ height: previewHeight }}>
                <CodePreview code={codeOutput} format={format} onFormatChange={setFormat} />
              </div>
              <DragResizeHandle onResize={(delta) => setPreviewHeight((h) => Math.max(60, Math.min(800, h - delta)))} />
              <div className="flex-1 min-h-0">
                <ExecutionPanel
                  workflow={workflow}
                  savedWorkflowId={savedWorkflowId}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <WorkflowConfigSheet
        open={configOpen}
        onOpenChange={setConfigOpen}
        workflow={workflow}
        suggestions={expressionSuggestions}
        onUpdateField={updateWorkflowField}
        onSetWorkflow={setWorkflow}
        onAddAgent={addAgent}
        onRemoveAgent={removeAgent}
        onAddStep={addStep}
        onRemoveStep={removeStep}
        onSelectAgent={(name) => {
          setConfigOpen(false);
          setSelectedNode({ type: 'agent', name });
        }}
        onSelectStep={(id) => {
          setConfigOpen(false);
          setSelectedNode({ type: 'step', id });
        }}
      />

      {selectedAgent && selectedNode?.type === 'agent' && (
        <AgentConfigSheet
          key={selectedNode.name}
          open={true}
          onOpenChange={() => setSelectedNode(null)}
          name={selectedNode.name}
          agent={selectedAgent}
          allAgentNames={allAgentNames}
          allSubWorkflowNames={allSubWorkflowNames}
          suggestions={expressionSuggestions}
          contextKeySuggestions={contextKeySuggestions}
          fullYaml={codeOutput}
          onUpdate={(agent) => updateAgent(selectedNode.name, agent)}
          onRename={(newName) => renameAgent(selectedNode.name, newName)}
          onDelete={() => removeAgent(selectedNode.name)}
        />
      )}

      {selectedStep && selectedNode?.type === 'step' && (
        <StepConfigSheet
          key={`${selectedNode.subWorkflowPath || ''}-${selectedNode.id}`}
          open={true}
          onOpenChange={() => setSelectedNode(null)}
          step={selectedStep}
          allStepIds={selectedNode.subWorkflowPath
            ? (workflow.sub_workflows?.[selectedNode.subWorkflowPath]?.steps.map(s => s.id) || [])
            : allStepIds
          }
          allAgentNames={allAgentNames}
          allSubWorkflowNames={allSubWorkflowNames}
          subWorkflowPath={selectedNode.subWorkflowPath}
          suggestions={expressionSuggestions}
          fullYaml={codeOutput}
          agents={workflow.agents}
          subWorkflows={workflow.sub_workflows}
          onUpdateAgent={(name, agent) => updateAgent(name, agent)}
          onUpdate={(step) => {
            if (selectedNode.subWorkflowPath) {
              const subWf = workflow.sub_workflows?.[selectedNode.subWorkflowPath];
              if (subWf) {
                updateSubWorkflow(selectedNode.subWorkflowPath, {
                  ...subWf,
                  steps: subWf.steps.map((s) => s.id === selectedNode.id ? step : s),
                });
              }
            } else {
              updateStep(selectedNode.id, step);
            }
          }}
          onRename={(newId) => {
            if (selectedNode.subWorkflowPath) {
              const subWf = workflow.sub_workflows?.[selectedNode.subWorkflowPath];
              if (subWf) {
                updateSubWorkflow(selectedNode.subWorkflowPath, {
                  ...subWf,
                  steps: subWf.steps.map((s) =>
                    s.id === selectedNode.id ? { ...s, id: newId } : s
                  ),
                });
              }
              setSelectedNode({ type: 'step', id: newId, subWorkflowPath: selectedNode.subWorkflowPath });
            } else {
              renameStep(selectedNode.id, newId);
            }
          }}
          onDelete={() => {
            if (selectedNode.subWorkflowPath) {
              const subWf = workflow.sub_workflows?.[selectedNode.subWorkflowPath];
              if (subWf) {
                updateSubWorkflow(selectedNode.subWorkflowPath, {
                  ...subWf,
                  steps: subWf.steps.filter((s) => s.id !== selectedNode.id),
                });
              }
              setSelectedNode(null);
            } else {
              removeStep(selectedNode.id);
            }
          }}
        />
      )}

      {selectedSubWorkflow && selectedNode?.type === 'subWorkflow' && (
        <SubWorkflowConfigSheet
          key={selectedNode.name}
          open={true}
          onOpenChange={() => setSelectedNode(null)}
          name={selectedNode.name}
          subWorkflow={selectedSubWorkflow}
          allAgentNames={allAgentNames}
          suggestions={expressionSuggestions}
          onUpdate={(subWf) => updateSubWorkflow(selectedNode.name, subWf)}
          onRename={(newName) => renameSubWorkflow(selectedNode.name, newName)}
          onDelete={() => removeSubWorkflow(selectedNode.name)}
        />
      )}
    </div>
  );
}
