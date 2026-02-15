import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Section, Field } from './config-sheet-primitives';
import { HelpTooltip, HelpSection, HelpCode } from './help-tooltip';
import type { WorkflowStep, RetryConfig } from '@/types/workflow';

interface StepRetrySectionProps {
  draft: WorkflowStep;
  update: <K extends keyof WorkflowStep>(key: K, value: WorkflowStep[K]) => void;
}

export function StepRetrySection({ draft, update }: StepRetrySectionProps) {
  const handleRetryChange = (field: keyof RetryConfig, raw: string) => {
    if (!draft.retry && !raw) return;
    const current: RetryConfig = draft.retry || { max_attempts: 3, backoff: 'fixed', delay_seconds: 1 };
    let value: number | string = raw;
    if (field === 'max_attempts' || field === 'delay_seconds') value = Number(raw) || 0;
    update('retry', { ...current, [field]: value });
  };

  return (
    <Section icon={RefreshCw} title="Retry" defaultOpen={!!draft.retry}>
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 -mt-1">
          <HelpTooltip title="Retry Configuration">
            <HelpSection title="What is this?">
              <p>Automatically retry this step if it fails.</p>
            </HelpSection>
            <HelpSection title="Backoff strategies">
              <p><strong>Fixed</strong> — Same delay between each retry.</p>
              <p><strong>Exponential</strong> — Doubling delay (1s, 2s, 4s...).</p>
            </HelpSection>
            <HelpSection title="Example">
              <HelpCode>{`retry:\n  max_attempts: 3\n  backoff: exponential\n  delay_seconds: 2`}</HelpCode>
            </HelpSection>
          </HelpTooltip>
        </div>
        {draft.retry ? (
          <>
            <Field label="Max Attempts">
              <Input type="number" value={draft.retry.max_attempts} onChange={(e) => handleRetryChange('max_attempts', e.target.value)} className="h-8 text-xs font-mono" />
            </Field>
            <Field label="Backoff">
              <Select value={draft.retry.backoff} onValueChange={(v) => handleRetryChange('backoff', v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed" className="text-xs">Fixed — Same delay each time</SelectItem>
                  <SelectItem value="exponential" className="text-xs">Exponential — Increasing delay</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Delay (seconds)">
              <Input type="number" step="0.5" value={draft.retry.delay_seconds} onChange={(e) => handleRetryChange('delay_seconds', e.target.value)} className="h-8 text-xs font-mono" />
            </Field>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => update('retry', undefined)}>
              <Trash2 className="h-3 w-3 mr-1" />
              Remove Retry
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => update('retry', { max_attempts: 3, backoff: 'fixed', delay_seconds: 1 })}>
            <Plus className="h-3 w-3 mr-1" />
            Add Retry Configuration
          </Button>
        )}
      </div>
    </Section>
  );
}
