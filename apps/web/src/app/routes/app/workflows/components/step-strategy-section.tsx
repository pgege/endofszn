import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, X, Zap } from 'lucide-react';
import { Section, Field } from './config-sheet-primitives';
import { HelpTooltip, HelpSection, HelpCode } from './help-tooltip';
import { ExpressionInput } from './expression-input';
import type { ExpressionSuggestion } from './expression-input';
import type { WorkflowStep, StepStrategy } from '@/types/workflow';

interface StepStrategySectionProps {
  draft: WorkflowStep;
  update: <K extends keyof WorkflowStep>(key: K, value: WorkflowStep[K]) => void;
  suggestions: ExpressionSuggestion[];
}

export function StepStrategySection({ draft, update, suggestions }: StepStrategySectionProps) {
  const [newStrategyItem, setNewStrategyItem] = useState('');
  const [newMatrixKey, setNewMatrixKey] = useState('');
  const [newMatrixValues, setNewMatrixValues] = useState('');

  const handleStrategyTypeChange = (type: StepStrategy['type'] | 'none') => {
    if (type === 'none') { update('strategy', undefined); return; }
    const base: StepStrategy = { type };
    if (type === 'matrix') base.matrix = {};
    else if (type !== 'parallel') base.items = [];
    update('strategy', base);
  };

  const addStrategyItem = () => {
    const val = newStrategyItem.trim();
    if (!val || !draft.strategy) return;
    const currentItems = Array.isArray(draft.strategy.items) ? draft.strategy.items : [];
    update('strategy', { ...draft.strategy, items: [...currentItems, val] });
    setNewStrategyItem('');
  };

  const removeStrategyItem = (index: number) => {
    if (!draft.strategy || !Array.isArray(draft.strategy.items)) return;
    const updated = draft.strategy.items.filter((_, i) => i !== index);
    update('strategy', { ...draft.strategy, items: updated.length > 0 ? updated : [] });
  };

  const handleStrategyItemsExpression = (val: string) => {
    if (!draft.strategy) return;
    update('strategy', { ...draft.strategy, items: val });
  };

  const addMatrixDimension = () => {
    const key = newMatrixKey.trim();
    if (!key || !draft.strategy) return;
    let values: unknown[];
    try { values = JSON.parse(newMatrixValues); if (!Array.isArray(values)) return; }
    catch { values = newMatrixValues.split(',').map((v) => v.trim()).filter(Boolean); }
    update('strategy', { ...draft.strategy, matrix: { ...(draft.strategy.matrix || {}), [key]: values } });
    setNewMatrixKey('');
    setNewMatrixValues('');
  };

  const removeMatrixDimension = (key: string) => {
    if (!draft.strategy?.matrix) return;
    const updated = { ...draft.strategy.matrix };
    delete updated[key];
    update('strategy', { ...draft.strategy, matrix: Object.keys(updated).length > 0 ? updated : undefined });
  };

  return (
    <Section icon={Zap} title="Strategy" defaultOpen={!!draft.strategy}>
      <div className="space-y-4">
        <Field label="Type" help={
          <HelpTooltip title="Execution Strategy">
            <HelpSection title="Strategy types">
              <p><strong>None</strong> — Step runs once (default).</p>
              <p><strong>Parallel</strong> — Runs simultaneously with peers.</p>
              <p><strong>For Each</strong> — Iterates over a list.</p>
              <p><strong>Matrix</strong> — All dimension combinations.</p>
            </HelpSection>
          </HelpTooltip>
        }>
          <Select value={draft.strategy?.type || 'none'} onValueChange={(v) => handleStrategyTypeChange(v as StepStrategy['type'] | 'none')}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None — Run once</SelectItem>
              <SelectItem value="parallel" className="text-xs">Parallel — Run simultaneously</SelectItem>
              <SelectItem value="for_each" className="text-xs">For Each — Iterate over a list</SelectItem>
              <SelectItem value="matrix" className="text-xs">Matrix — All combinations</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {draft.strategy && draft.strategy.type !== 'matrix' && (
          <Field label="Items" help={
            <HelpTooltip title="Strategy Items">
              <HelpSection title="What is this?">
                <p>The list of items to iterate over, or a dynamic expression.</p>
              </HelpSection>
              <HelpSection title="Example">
                <HelpCode>{`$\{{ steps.get-products.output.product_ids }}`}</HelpCode>
              </HelpSection>
            </HelpTooltip>
          }>
            {typeof draft.strategy.items === 'string' ? (
              <ExpressionInput
                value={draft.strategy.items}
                onChange={handleStrategyItemsExpression}
                suggestions={suggestions}
                placeholder="${{ steps.get-products.output.product_ids }}"
              />
            ) : (
              <>
                {Array.isArray(draft.strategy.items) && draft.strategy.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {draft.strategy.items.map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">
                        {String(item)}
                        <button type="button" onClick={() => removeStrategyItem(i)} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input value={newStrategyItem} onChange={(e) => setNewStrategyItem(e.target.value)} placeholder="Item value or ${{ expression }}" className="h-8 text-xs font-mono flex-1" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStrategyItem(); } }} />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addStrategyItem} disabled={!newStrategyItem.trim()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </Field>
        )}

        {draft.strategy?.type === 'matrix' && (
          <Field label="Matrix Dimensions" help={
            <HelpTooltip title="Matrix Dimensions">
              <HelpSection title="How to enter values">
                <p>Enter values as JSON array or comma-separated.</p>
              </HelpSection>
            </HelpTooltip>
          }>
            {draft.strategy.matrix && Object.entries(draft.strategy.matrix).map(([key, vals]) => (
              <div key={key} className="flex items-center gap-2 text-xs mb-1.5">
                <span className="font-mono w-20 truncate">{key}</span>
                <span className="text-muted-foreground flex-1 truncate font-mono">[{(vals as unknown[]).map(String).join(', ')}]</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeMatrixDimension(key)}>
                  <X className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input value={newMatrixKey} onChange={(e) => setNewMatrixKey(e.target.value)} placeholder="key" className="h-8 text-xs font-mono w-1/4" />
              <Input value={newMatrixValues} onChange={(e) => setNewMatrixValues(e.target.value)} placeholder='["a","b"] or a,b,c' className="h-8 text-xs font-mono flex-1" />
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addMatrixDimension} disabled={!newMatrixKey.trim() || !newMatrixValues.trim()}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </Field>
        )}
      </div>
    </Section>
  );
}
