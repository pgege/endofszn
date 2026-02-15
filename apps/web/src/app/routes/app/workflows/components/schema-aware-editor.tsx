import { useState, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import { lintGutter } from '@codemirror/lint';
import { Braces, Type, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentSchema } from '@/types/workflow';
import type { ExpressionSuggestion } from './expression-input';
import { ExpressionInput } from './expression-input';
import {
  schemaLinter,
  expressionCompletion,
  expressionHighlight,
  expressionHighlightTheme,
} from './codemirror-schema-extensions';
import { generateScaffold } from './schema-scaffold';

interface SchemaAwareEditorProps {
  value: string | Record<string, unknown>;
  onChange: (value: string | Record<string, unknown>) => void;
  schema?: AgentSchema;
  suggestions?: ExpressionSuggestion[];
  placeholder?: string;
  label?: string;
}

type EditorMode = 'string' | 'json';

function detectMode(schema?: AgentSchema, value?: string | Record<string, unknown>): EditorMode {
  if (typeof value === 'object' && value !== null) return 'json';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  }
  if (schema && (schema.type === 'object' || schema.type === 'array')) return 'json';
  return 'string';
}

function valueToString(value: string | Record<string, unknown>): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function stringToValue(str: string): string | Record<string, unknown> {
  const trimmed = str.trim();
  if (!trimmed) return '';
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {
    // not valid JSON, that's fine
  }
  return str;
}

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

export function SchemaAwareEditor({
  value,
  onChange,
  schema,
  suggestions = [],
  placeholder,
  label,
}: SchemaAwareEditorProps) {
  const initialMode = useMemo(() => detectMode(schema, value), []);
  const [mode, setMode] = useState<EditorMode>(initialMode);

  const stringValue = useMemo(() => valueToString(value), [value]);

  const handleChange = useCallback(
    (val: string) => {
      if (mode === 'json') {
        onChange(stringToValue(val));
      } else {
        onChange(val);
      }
    },
    [onChange, mode]
  );

  const handleScaffold = useCallback(() => {
    if (!schema) return;
    const scaffold = generateScaffold(schema);
    onChange(stringToValue(scaffold));
    if (mode !== 'json') setMode('json');
  }, [schema, onChange, mode]);

  const switchMode = useCallback((newMode: EditorMode) => {
    setMode(newMode);
  }, []);

  const jsonExtensions = useMemo(
    () => [
      editorTheme,
      json(),
      EditorView.lineWrapping,
      lintGutter(),
      schemaLinter(schema),
      expressionCompletion(suggestions),
      expressionHighlight,
      expressionHighlightTheme,
    ],
    [schema, suggestions]
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        {label && <span className="text-xs font-medium text-foreground">{label}</span>}
        <div className="flex items-center gap-1 ml-auto">
          {schema && mode === 'json' && (
            <button
              type="button"
              onClick={handleScaffold}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Generate template from schema"
            >
              <Wand2 className="h-3 w-3" />
              Template
            </button>
          )}
          <div className="inline-flex items-center border border-border bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => switchMode('string')}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium transition-colors',
                mode === 'string'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Type className="h-3 w-3" />
              String
            </button>
            <button
              type="button"
              onClick={() => switchMode('json')}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium transition-colors',
                mode === 'json'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Braces className="h-3 w-3" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {mode === 'string' ? (
        <ExpressionInput
          value={stringValue}
          onChange={handleChange}
          suggestions={suggestions}
          multiline
          placeholder={placeholder ?? '${{ trigger.message }}'}
        />
      ) : (
        <CodeMirror
          value={stringValue}
          onChange={handleChange}
          extensions={jsonExtensions}
          theme={vscodeDark}
          minHeight="80px"
          maxHeight="300px"
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
      )}
    </div>
  );
}
