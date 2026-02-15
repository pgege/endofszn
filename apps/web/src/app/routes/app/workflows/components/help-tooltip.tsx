import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HelpTooltipProps {
  title: string;
  children: React.ReactNode;
}

export function HelpTooltip({ title, children }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">{title}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground space-y-3">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-foreground mb-1">{title}</p>
      {children}
    </div>
  );
}

export function HelpCode({ children }: { children: string }) {
  return (
    <pre className="bg-muted px-3 py-2 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
      {children}
    </pre>
  );
}
