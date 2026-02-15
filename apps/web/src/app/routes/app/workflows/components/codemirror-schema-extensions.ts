import { linter, type Diagnostic } from '@codemirror/lint';
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import {
  ViewPlugin,
  Decoration,
  EditorView,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import type { AgentSchema, SchemaField } from '@/types/workflow';
import type { ExpressionSuggestion } from './expression-input';

const EXPR_RE = /\$\{\{.*?\}\}/g;

function stripExpressions(text: string): { cleaned: string; offsets: { start: number; end: number; replacement: string }[] } {
  const offsets: { start: number; end: number; replacement: string }[] = [];
  let match: RegExpExecArray | null;
  EXPR_RE.lastIndex = 0;
  while ((match = EXPR_RE.exec(text)) !== null) {
    const placeholder = `"__expr_${offsets.length}__"`;
    offsets.push({ start: match.index, end: match.index + match[0].length, replacement: placeholder });
  }

  let cleaned = text;
  for (let i = offsets.length - 1; i >= 0; i--) {
    const o = offsets[i];
    cleaned = cleaned.slice(0, o.start) + o.replacement + cleaned.slice(o.end);
  }
  return { cleaned, offsets };
}

function lineColToPos(text: string, line: number, col: number): number {
  const lines = text.split('\n');
  let pos = 0;
  for (let i = 0; i < line && i < lines.length; i++) {
    pos += lines[i].length + 1;
  }
  return pos + col;
}

function validateAgainstSchema(
  parsed: unknown,
  schema: AgentSchema,
  diagnostics: Diagnostic[],
  text: string
) {
  if (schema.type === 'object' && schema.properties && typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    const props = schema.properties;

    for (const key of Object.keys(obj)) {
      if (!(key in props)) {
        const keyPattern = new RegExp(`"${key}"\\s*:`);
        const match = keyPattern.exec(text);
        if (match) {
          diagnostics.push({
            from: match.index,
            to: match.index + match[0].length,
            severity: 'warning',
            message: `Unknown property "${key}" — not defined in schema`,
          });
        }
      }
    }

    if (schema.required) {
      for (const req of schema.required) {
        if (!(req in obj)) {
          diagnostics.push({
            from: 0,
            to: Math.min(1, text.length),
            severity: 'error',
            message: `Missing required property "${req}"`,
          });
        }
      }
    }

    for (const [key, field] of Object.entries(props)) {
      if (key in obj) {
        const val = obj[key];
        if (val !== null && val !== undefined && typeof val !== 'string') {
          const expectedType = (field as SchemaField).type;
          const actualType = Array.isArray(val) ? 'array' : typeof val;
          if (expectedType && actualType !== expectedType && expectedType !== 'object') {
            const keyPattern = new RegExp(`"${key}"\\s*:`);
            const match = keyPattern.exec(text);
            if (match) {
              diagnostics.push({
                from: match.index,
                to: match.index + match[0].length,
                severity: 'warning',
                message: `Property "${key}" expects type "${expectedType}" but got "${actualType}"`,
              });
            }
          }
        }
      }
    }
  }

  if (schema.type === 'array' && !Array.isArray(parsed)) {
    diagnostics.push({
      from: 0,
      to: Math.min(1, text.length),
      severity: 'error',
      message: 'Schema expects an array',
    });
  }
}

export function schemaLinter(schema: AgentSchema | undefined) {
  return linter((view) => {
    const text = view.state.doc.toString().trim();
    if (!text) return [];

    const diagnostics: Diagnostic[] = [];
    const { cleaned } = stripExpressions(text);

    try {
      const parsed = JSON.parse(cleaned);

      if (schema) {
        validateAgainstSchema(parsed, schema, diagnostics, text);
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        const msg = e.message;
        const posMatch = msg.match(/position (\d+)/i);
        const lineColMatch = msg.match(/line (\d+) column (\d+)/i);

        let from = 0;
        if (posMatch) {
          from = Math.min(parseInt(posMatch[1], 10), text.length - 1);
        } else if (lineColMatch) {
          from = lineColToPos(text, parseInt(lineColMatch[1], 10) - 1, parseInt(lineColMatch[2], 10) - 1);
        }
        from = Math.max(0, Math.min(from, text.length - 1));
        const to = Math.min(from + 1, text.length);

        diagnostics.push({
          from,
          to,
          severity: 'error',
          message: `JSON syntax error: ${msg.replace(/^JSON\.parse: /, '')}`,
        });
      }
    }

    return diagnostics;
  });
}

export function expressionCompletion(suggestions: ExpressionSuggestion[]) {
  function completionSource(context: CompletionContext): CompletionResult | null {
    const { state, pos } = context;
    const line = state.doc.lineAt(pos);
    const textBefore = line.text.slice(0, pos - line.from);

    const openIdx = textBefore.lastIndexOf('${{');
    if (openIdx === -1) return null;

    const afterOpen = textBefore.slice(openIdx + 3);
    if (afterOpen.includes('}}')) return null;

    const partial = afterOpen.trimStart();
    const from = line.from + openIdx + 3 + (afterOpen.length - afterOpen.trimStart().length);

    const filtered = suggestions.filter(
      (s) =>
        s.label.toLowerCase().includes(partial.toLowerCase()) ||
        s.value.toLowerCase().includes(partial.toLowerCase())
    );

    if (filtered.length === 0) return null;

    return {
      from,
      to: pos,
      options: filtered.map((s) => ({
        label: s.label,
        detail: s.description,
        apply: `${s.value} }}`,
      })),
    };
  }

  return autocompletion({
    override: [completionSource],
    activateOnTyping: true,
  });
}

const exprDecoration = Decoration.mark({ class: 'cm-expression-highlight' });

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const text = view.state.doc.toString();
  EXPR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EXPR_RE.exec(text)) !== null) {
    builder.add(match.index, match.index + match[0].length, exprDecoration);
  }
  return builder.finish();
}

export const expressionHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

export const expressionHighlightTheme = EditorView.baseTheme({
  '.cm-expression-highlight': {
    backgroundColor: 'rgba(130, 170, 255, 0.15)',
    borderRadius: '2px',
    padding: '0 1px',
  },
});

const SCHEMA_TOP_KEYS = [
  { label: '"type"', detail: 'Schema type (string, object, array)' },
  { label: '"description"', detail: 'What this schema represents' },
  { label: '"properties"', detail: 'Object property definitions' },
  { label: '"required"', detail: 'Required property names' },
  { label: '"items"', detail: 'Array item type definition' },
];

const PROP_KEYS = [
  { label: '"type"', detail: 'Property type' },
  { label: '"description"', detail: 'Property description' },
  { label: '"enum"', detail: 'Allowed values list' },
  { label: '"items"', detail: 'Array item type' },
  { label: '"properties"', detail: 'Nested object properties' },
];

const TYPE_VALUES = [
  { label: '"string"', detail: 'Text value' },
  { label: '"number"', detail: 'Numeric value' },
  { label: '"boolean"', detail: 'True or false' },
  { label: '"array"', detail: 'List of items' },
  { label: '"object"', detail: 'Nested object' },
];

export function schemaKeywordCompletion() {
  function completionSource(context: CompletionContext): CompletionResult | null {
    const { state, pos } = context;
    const line = state.doc.lineAt(pos);
    const textBefore = line.text.slice(0, pos - line.from);

    const quoteMatch = textBefore.match(/"([^"]*)$/);
    if (!quoteMatch) return null;

    const partial = quoteMatch[1];
    const from = pos - partial.length;

    const fullTextBefore = state.doc.sliceString(0, pos);
    const isAfterColon = /:\s*"[^"]*$/.test(textBefore);

    if (isAfterColon) {
      const keyMatch = textBefore.match(/"(\w+)"\s*:\s*"[^"]*$/);
      if (keyMatch && keyMatch[1] === 'type') {
        const filtered = TYPE_VALUES.filter((k) =>
          k.label.slice(1, -1).startsWith(partial)
        );
        if (filtered.length === 0) return null;
        return {
          from,
          to: pos,
          options: filtered.map((k) => ({
            label: k.label.slice(1, -1),
            detail: k.detail,
            apply: k.label.slice(1, -1),
          })),
        };
      }
      return null;
    }

    const depth = (fullTextBefore.match(/{/g) || []).length - (fullTextBefore.match(/}/g) || []).length;
    const keys = depth <= 1 ? SCHEMA_TOP_KEYS : PROP_KEYS;

    const filtered = keys.filter((k) =>
      k.label.slice(1, -1).startsWith(partial)
    );
    if (filtered.length === 0) return null;

    return {
      from,
      to: pos,
      options: filtered.map((k) => ({
        label: k.label.slice(1, -1),
        detail: k.detail,
        apply: k.label.slice(1, -1),
      })),
    };
  }

  return autocompletion({
    override: [completionSource],
    activateOnTyping: true,
  });
}

export function schemaDefinitionLinter() {
  return linter((view) => {
    const text = view.state.doc.toString().trim();
    if (!text) return [];

    const diagnostics: Diagnostic[] = [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      if (e instanceof SyntaxError) {
        const msg = e.message;
        const posMatch = msg.match(/position (\d+)/i);
        let from = 0;
        if (posMatch) {
          from = Math.min(parseInt(posMatch[1], 10), text.length - 1);
        }
        from = Math.max(0, from);
        diagnostics.push({
          from,
          to: Math.min(from + 1, text.length),
          severity: 'error',
          message: `JSON syntax error: ${msg.replace(/^JSON\.parse: /, '')}`,
        });
      }
      return diagnostics;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      diagnostics.push({
        from: 0,
        to: Math.min(1, text.length),
        severity: 'error',
        message: 'Schema must be a JSON object',
      });
      return diagnostics;
    }

    const obj = parsed as Record<string, unknown>;

    if (!obj.type) {
      diagnostics.push({
        from: 0,
        to: Math.min(1, text.length),
        severity: 'warning',
        message: 'Schema should have a "type" field (string, object, or array)',
      });
    } else if (!['string', 'object', 'array'].includes(obj.type as string)) {
      const typeMatch = text.match(/"type"\s*:\s*"[^"]*"/);
      if (typeMatch) {
        diagnostics.push({
          from: typeMatch.index!,
          to: typeMatch.index! + typeMatch[0].length,
          severity: 'warning',
          message: 'Type should be "string", "object", or "array"',
        });
      }
    }

    if (obj.type === 'object' && obj.properties) {
      if (typeof obj.properties !== 'object' || Array.isArray(obj.properties)) {
        const propsMatch = text.match(/"properties"\s*:/);
        if (propsMatch) {
          diagnostics.push({
            from: propsMatch.index!,
            to: propsMatch.index! + propsMatch[0].length,
            severity: 'error',
            message: '"properties" must be an object',
          });
        }
      }
    }

    if (obj.required) {
      if (!Array.isArray(obj.required)) {
        const reqMatch = text.match(/"required"\s*:/);
        if (reqMatch) {
          diagnostics.push({
            from: reqMatch.index!,
            to: reqMatch.index! + reqMatch[0].length,
            severity: 'error',
            message: '"required" must be an array of property names',
          });
        }
      }
    }

    return diagnostics;
  });
}
