import { useState, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import { lintGutter } from '@codemirror/lint';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  schemaDefinitionLinter,
  schemaKeywordCompletion,
} from './codemirror-schema-extensions';
import type { AgentSchema } from '@/types/workflow';

const SCHEMA_PRESETS: { label: string; value: AgentSchema }[] = [
  {
    label: 'Simple text',
    value: { type: 'string', description: 'A text response' },
  },
  {
    label: 'Classification',
    value: {
      type: 'object',
      description: 'Classification result',
      properties: {
        category: { type: 'string', description: 'The chosen category' },
        confidence: { type: 'number', description: 'Confidence score 0-1' },
      },
      required: ['category'],
    },
  },
  {
    label: 'List of items',
    value: {
      type: 'array',
      description: 'List of items',
      items: { type: 'string' },
    },
  },
  {
    label: 'Key-value extraction',
    value: {
      type: 'object',
      description: 'Extracted information',
      properties: {
        name: { type: 'string', description: 'Extracted name' },
        value: { type: 'string', description: 'Extracted value' },
      },
      required: ['name', 'value'],
    },
  },
  {
    label: 'Routing decision',
    value: {
      type: 'string',
      description: "Route name, e.g. 'product', 'order', 'general'",
    },
  },
];

const editorTheme = EditorView.theme({
  '&': {
    fontSize: '12px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  '.cm-gutters': {
    borderRight: 'none',
    background: 'transparent',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    lineHeight: '1.6',
  },
  '.cm-content': {
    padding: '8px 0',
  },
  '&.cm-focused': {
    outline: 'none',
  },
});

interface SchemaBuilderProps {
  value?: AgentSchema;
  onChange: (schema: AgentSchema | undefined) => void;
  label: string;
}

export function SchemaBuilder({ value, onChange, label }: SchemaBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(!!value);

  const jsonString = useMemo(() => {
    if (!value) return '';
    return JSON.stringify(value, null, 2);
  }, [value]);

  const handleEditorChange = useCallback(
    (val: string) => {
      const trimmed = val.trim();
      if (!trimmed) {
        onChange(undefined);
        return;
      }
      try {
        const parsed = JSON.parse(trimmed) as AgentSchema;
        if (parsed && typeof parsed === 'object') {
          onChange(parsed);
        }
      } catch {
        // invalid JSON, don't update yet - the linter will show the error
      }
    },
    [onChange]
  );

  const extensions = useMemo(
    () => [
      editorTheme,
      json(),
      EditorView.lineWrapping,
      lintGutter(),
      schemaDefinitionLinter(),
      schemaKeywordCompletion(),
    ],
    []
  );

  if (!showBuilder && !value) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs w-full"
          onClick={() => {
            setShowBuilder(true);
            onChange({ type: 'string', description: '' });
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add {label}
        </Button>
        <div className="flex flex-wrap gap-1">
          {SCHEMA_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => {
                setShowBuilder(true);
                onChange(preset.value);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 border border-border p-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2 text-destructive"
          onClick={() => {
            setShowBuilder(false);
            onChange(undefined);
          }}
        >
          <Trash2 className="h-2.5 w-2.5 mr-1" />
          Remove
        </Button>
      </div>

      <CodeMirror
        value={jsonString}
        onChange={handleEditorChange}
        extensions={extensions}
        theme={vscodeDark}
        minHeight="60px"
        maxHeight="250px"
        className="border border-border overflow-hidden"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          bracketMatching: true,
          autocompletion: false,
        }}
      />

      <div className="flex flex-wrap gap-1">
        <span className="text-[10px] text-muted-foreground mr-1 self-center">Presets:</span>
        {SCHEMA_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="h-5 text-[10px] px-2"
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
