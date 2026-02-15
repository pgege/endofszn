import React from 'react';
import { ChevronDown, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SheetFooter } from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function Section({
  icon: Icon,
  title,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="border bg-card">
        <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-muted/50 transition-colors group">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium flex-1 text-left">{title}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function Field({ label, help, required, children }: { label: string; help?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
        {help}
      </div>
      {children}
    </div>
  );
}

export function TagList({ items, onRemove }: { items: string[]; onRemove: (item: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="font-mono text-xs gap-1 pr-1">
          {item}
          <button type="button" onClick={() => onRemove(item)} className="ml-0.5 hover:text-destructive">
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export function ConfigSheetFooter({
  onDelete,
  onCancel,
  onSave,
  saveDisabled,
}: {
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <SheetFooter className="mt-0! flex-row! border-t px-6 py-3 shrink-0 items-center justify-between">
      <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={onDelete}>
        <Trash2 className="h-3 w-3 mr-1" />
        Delete
      </Button>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={onSave} disabled={saveDisabled}>
          Save
        </Button>
      </div>
    </SheetFooter>
  );
}
