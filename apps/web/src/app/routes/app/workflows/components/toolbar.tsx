import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings2, Plus, Check, Save, Loader2, ChevronDown, FileText, Trash2, LayoutTemplate, Pencil, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { TemplateDrawer } from './template-drawer';
import type { WorkflowStep } from '@/types/workflow';
import type { Workflow } from '@/lib/api/workflows';

interface ToolbarProps {
  onLoadTemplate: (index: number) => void;
  onLoadSavedWorkflow: (workflow: Workflow) => void;
  onNewWorkflow: () => void;
  onOpenConfig: () => void;
  onAddStep: (step: WorkflowStep) => void;
  onSave: () => Promise<Workflow | null>;
  onSaveAs: (name: string) => Promise<Workflow | null>;
  isSaving: boolean;
  isDirty: boolean;
  savedWorkflowId: string | null;
  workflowName: string;
  onNameChange: (name: string) => void;
  existingStepIds: string[];
  agentNames: string[];
  savedWorkflows: Workflow[];
  onDeleteWorkflow: (id: string) => void;
}

export function Toolbar({
  onLoadTemplate,
  onLoadSavedWorkflow,
  onNewWorkflow,
  onOpenConfig,
  onAddStep,
  onSave,
  onSaveAs,
  isSaving,
  isDirty,
  savedWorkflowId,
  workflowName,
  onNameChange,
  existingStepIds,
  agentNames,
  savedWorkflows,
  onDeleteWorkflow,
}: ToolbarProps) {
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [newStepId, setNewStepId] = useState('');
  const [newStepAgent, setNewStepAgent] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [templateDrawerOpen, setTemplateDrawerOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(workflowName);
  const [originalName, setOriginalName] = useState(workflowName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const focusTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const saveSuccessTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setEditingName(workflowName);
    setOriginalName(workflowName);
  }, [workflowName]);

  const startEditingName = useCallback(() => {
    if (!savedWorkflowId) return;
    setOriginalName(workflowName);
    setEditingName(workflowName);
    setIsEditingName(true);
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [savedWorkflowId, workflowName]);

  const confirmNameEdit = useCallback(async () => {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === originalName) {
      setIsEditingName(false);
      setEditingName(originalName);
      return;
    }
    onNameChange(trimmed);
    setIsEditingName(false);
    await new Promise((r) => setTimeout(r, 0));
    const result = await onSave();
    if (result) {
      setSaveSuccess(true);
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
      saveSuccessTimerRef.current = setTimeout(() => setSaveSuccess(false), 2000);
    }
  }, [editingName, originalName, onNameChange, onSave]);

  const cancelNameEdit = useCallback(() => {
    setEditingName(originalName);
    setIsEditingName(false);
  }, [originalName]);

  const handleAddStep = () => {
    const id = newStepId.trim();
    if (!id || existingStepIds.includes(id)) return;
    const step: WorkflowStep = { id };
    if (newStepAgent && newStepAgent !== '__none__') {
      step.agent = newStepAgent;
    }
    onAddStep(step);
    setNewStepId('');
    setNewStepAgent('');
    setAddStepOpen(false);
  };

  const handleSaveClick = useCallback(async () => {
    if (!savedWorkflowId) {
      setSaveAsName(workflowName);
      setSaveAsOpen(true);
      return;
    }
    const result = await onSave();
    if (result) {
      setSaveSuccess(true);
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
      saveSuccessTimerRef.current = setTimeout(() => setSaveSuccess(false), 2000);
    }
  }, [savedWorkflowId, onSave, workflowName]);

  const handleSaveAsClick = useCallback(() => {
    setSaveAsName(savedWorkflowId ? `${workflowName} (copy)` : workflowName);
    setSaveAsOpen(true);
  }, [workflowName, savedWorkflowId]);

  const handleConfirmSaveAs = useCallback(async () => {
    const trimmed = saveAsName.trim();
    if (!trimmed) return;
    setSaveAsOpen(false);
    const result = await onSaveAs(trimmed);
    if (result) {
      setSaveSuccess(true);
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
      saveSuccessTimerRef.current = setTimeout(() => setSaveSuccess(false), 2000);
    }
  }, [saveAsName, onSaveAs]);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {isEditingName ? (
            <>
              <Input
                ref={nameInputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="h-7 text-xs font-mono w-40 md:w-52"
                placeholder="workflow-name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmNameEdit(); }
                  if (e.key === 'Escape') { e.preventDefault(); cancelNameEdit(); }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={confirmNameEdit}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={cancelNameEdit}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs font-mono truncate max-w-40 md:max-w-52">
                {workflowName}
              </span>
              {savedWorkflowId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={startEditingName}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </>
          )}
        </div>

        <Popover open={addStepOpen} onOpenChange={setAddStepOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Step
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <p className="text-xs font-medium">New Step</p>
              <div className="space-y-2">
                <Input
                  value={newStepId}
                  onChange={(e) => setNewStepId(e.target.value)}
                  placeholder="step-id"
                  className="h-7 text-xs font-mono"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep(); } }}
                  autoFocus
                />
                <Select value={newStepAgent} onValueChange={setNewStepAgent}>
                  <SelectTrigger className="h-7 text-xs font-mono">
                    <SelectValue placeholder="Assign agent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="text-xs">None</SelectItem>
                    {agentNames.map((a) => (
                      <SelectItem key={a} value={a} className="text-xs font-mono">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={handleAddStep}
                disabled={!newStepId.trim() || existingStepIds.includes(newStepId.trim())}
              >
                Create Step
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onOpenConfig}>
          <Settings2 className="h-3 w-3 mr-1" />
          Config
        </Button>

        <div className="flex items-center">
          <Popover open={saveAsOpen} onOpenChange={setSaveAsOpen}>
            <PopoverTrigger asChild>
              <span className="sr-only">Save As trigger</span>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <div className="space-y-3">
                <p className="text-xs font-medium">Save As</p>
                <Input
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  placeholder="Workflow name"
                  className="h-7 text-xs font-mono"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmSaveAs(); } }}
                  autoFocus
                />
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={handleConfirmSaveAs}
                  disabled={!saveAsName.trim() || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Save As
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            size="sm"
            className="h-7 text-xs rounded-r-none border-r-0"
            onClick={handleSaveClick}
            disabled={isSaving || (!!savedWorkflowId && !isDirty)}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            {saveSuccess ? 'Saved' : savedWorkflowId ? 'Save' : 'Save As'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="h-7 px-1 rounded-l-none"
                disabled={isSaving}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {savedWorkflowId && (
                <DropdownMenuItem
                  onClick={handleSaveClick}
                  disabled={!isDirty}
                  className="text-xs gap-2"
                >
                  <Save className="h-3 w-3" />
                  Save
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleSaveAsClick}
                className="text-xs gap-2"
              >
                <Copy className="h-3 w-3" />
                Save As...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <FileText className="h-3 w-3" />
              Workflows
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={onNewWorkflow} className="text-xs gap-2">
              <Plus className="h-3 w-3" />
              New Workflow
            </DropdownMenuItem>

            {savedWorkflows.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">My Workflows</DropdownMenuLabel>
                {savedWorkflows.map((wf) => (
                  <DropdownMenuItem
                    key={wf.id}
                    onClick={() => onLoadSavedWorkflow(wf)}
                    className="text-xs gap-2 group"
                  >
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate flex-1">{wf.name}</span>
                    {wf.id === savedWorkflowId && (
                      <Check className="h-3 w-3 shrink-0 text-primary" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDeleteTarget({ id: wf.id, name: wf.name });
                      }}
                      className="h-4 w-4 shrink-0 hidden group-hover:flex items-center justify-center hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTemplateDrawerOpen(true)}
              className="text-xs gap-2"
            >
              <LayoutTemplate className="h-3 w-3 shrink-0" />
              Browse Templates...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) onDeleteWorkflow(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemplateDrawer
        open={templateDrawerOpen}
        onOpenChange={setTemplateDrawerOpen}
        onSelect={onLoadTemplate}
      />
    </div>
  );
}
