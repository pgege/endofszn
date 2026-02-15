import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  GitBranch,
  Layers,
  Shield,
  Sparkles,
  Zap,
  Network,
  Workflow,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { examples } from '../examples';
import type { WorkflowExample } from '@/types/workflow';

const categories = ['Basics', 'Strategies', 'Advanced', 'Error Handling'] as const;

const categoryMeta: Record<string, { icon: typeof Bot; color: string }> = {
  Basics: { icon: Zap, color: 'text-green-500' },
  Strategies: { icon: GitBranch, color: 'text-blue-500' },
  Advanced: { icon: Sparkles, color: 'text-purple-500' },
  'Error Handling': { icon: Shield, color: 'text-orange-500' },
};

function FlowPreview({ example }: { example: WorkflowExample }) {
  const { workflow } = example;
  const agentNames = Object.keys(workflow.agents);
  const steps = workflow.steps;
  const subWorkflows = workflow.sub_workflows
    ? Object.keys(workflow.sub_workflows)
    : [];

  const hasStrategy = steps.some((s) => s.strategy);
  const strategyType = steps.find((s) => s.strategy)?.strategy?.type;
  const hasConditionals = steps.some((s) => s.if);
  const hasRetry = steps.some((s) => s.retry);
  const hasAttachments = steps.some((s) => s.attachments);
  const hasDelegation = agentNames.some(
    (n) => workflow.agents[n].can_call_agents?.length
  );
  const hasSubWorkflows = subWorkflows.length > 0;
  const hasContext = agentNames.some(
    (n) =>
      workflow.agents[n].context_reads?.length ||
      (workflow.agents[n].context_writes &&
        Object.keys(workflow.agents[n].context_writes!).length > 0)
  );
  const hasVariables =
    workflow.variables && Object.keys(workflow.variables).length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Bot className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {agentNames.length} agent{agentNames.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {steps.length} step{steps.length !== 1 ? 's' : ''}
          </span>
        </div>
        {hasSubWorkflows && (
          <div className="flex items-center gap-1">
            <Network className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {subWorkflows.length} sub-workflow
              {subWorkflows.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 min-h-[28px]">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className={cn(
                'px-1.5 py-0.5 border text-[9px] font-mono truncate max-w-[72px]',
                step.strategy
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                  : step.if
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                    : step.sub_workflow
                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-400'
                      : 'border-border bg-muted/50 text-muted-foreground'
              )}
            >
              {step.id}
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {hasStrategy && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            {strategyType}
          </Badge>
        )}
        {hasConditionals && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            conditional
          </Badge>
        )}
        {hasDelegation && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            delegation
          </Badge>
        )}
        {hasRetry && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            retry
          </Badge>
        )}
        {hasAttachments && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            attachments
          </Badge>
        )}
        {hasContext && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            shared context
          </Badge>
        )}
        {hasSubWorkflows && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            sub-workflows
          </Badge>
        )}
        {hasVariables && (
          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
            variables
          </Badge>
        )}
      </div>
    </div>
  );
}

function McpServerPills({ example }: { example: WorkflowExample }) {
  const servers = new Set<string>();
  for (const agent of Object.values(example.workflow.agents)) {
    agent.mcp_servers?.forEach((s) => servers.add(s));
  }
  if (servers.size === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(servers).map((s) => (
        <span
          key={s}
          className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 font-mono"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

interface TemplateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (index: number) => void;
}

export function TemplateDrawer({
  open,
  onOpenChange,
  onSelect,
}: TemplateDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered =
    activeCategory === 'all'
      ? examples
      : examples.filter((e) => e.category === activeCategory);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Workflow className="h-4 w-4" />
            Workflow Templates
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Choose a template to start with. Each uses a different architecture
            pattern for managing your storefront.
          </p>
        </SheetHeader>

        <div className="px-5 pb-3 shrink-0">
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={cn(
                'px-2.5 py-1 text-[11px] border transition-colors',
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50'
              )}
            >
              All ({examples.length})
            </button>
            {categories.map((cat) => {
              const count = examples.filter((e) => e.category === cat).length;
              const meta = categoryMeta[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-2.5 py-1 text-[11px] border transition-colors flex items-center gap-1',
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  )}
                >
                  <meta.icon className={cn('h-3 w-3', activeCategory === cat ? '' : meta.color)} />
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 pb-5 space-y-3">
            {filtered.map((example, filteredIndex) => {
              const globalIndex = examples.indexOf(example);
              const meta = categoryMeta[example.category];

              return (
                <button
                  key={globalIndex}
                  type="button"
                  onClick={() => {
                    onSelect(globalIndex);
                    onOpenChange(false);
                  }}
                  className="w-full text-left border bg-card hover:border-primary/50 hover:shadow-lg transition-all p-4 space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <meta.icon
                          className={cn('h-3.5 w-3.5 shrink-0', meta.color)}
                        />
                        <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {example.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {example.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 shrink-0"
                    >
                      {example.category}
                    </Badge>
                  </div>

                  <McpServerPills example={example} />
                  <FlowPreview example={example} />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
