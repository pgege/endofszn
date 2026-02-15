import { useCallback, useRef, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'yaml' | 'json';
  readOnly?: boolean;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

const baseTheme = EditorView.theme({
  '&': {
    fontSize: '12px',
    borderRadius: '8px',
  },
  '.cm-gutters': {
    borderRight: 'none',
    background: 'transparent',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    lineHeight: '1.6',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '8px 0',
  },
  '&.cm-focused': {
    outline: 'none',
  },
});

export function CodeEditor({
  value,
  onChange,
  language = 'yaml',
  readOnly = false,
  height,
  minHeight = '100px',
  maxHeight,
  className = '',
}: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange?.(val);
    },
    [onChange]
  );

  const extensions = [
    baseTheme,
    language === 'yaml' ? yaml() : json(),
    EditorView.lineWrapping,
  ];

  const fillParent = height === '100%';
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!fillParent || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMeasuredHeight(Math.floor(entry.contentRect.height));
      }
    });
    observer.observe(el);
    setMeasuredHeight(Math.floor(el.getBoundingClientRect().height));
    return () => observer.disconnect();
  }, [fillParent]);

  if (fillParent) {
    return (
      <div
        ref={containerRef}
        style={{ flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}
      >
        {measuredHeight != null && measuredHeight > 0 && (
          <CodeMirror
            value={value}
            onChange={handleChange}
            extensions={extensions}
            theme={vscodeDark}
            readOnly={readOnly}
            editable={!readOnly}
            height={`${measuredHeight}px`}
            className={`border border-border ${className}`}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: !readOnly,
              highlightSelectionMatches: true,
              bracketMatching: true,
              autocompletion: false,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme={vscodeDark}
      readOnly={readOnly}
      editable={!readOnly}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      className={`border border-border ${className}`}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        highlightSelectionMatches: true,
        bracketMatching: true,
        autocompletion: false,
      }}
    />
  );
}
