import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ExpressionSuggestion {
  label: string;
  value: string;
  description?: string;
  category?: string;
}

interface ExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: ExpressionSuggestion[];
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  helpText?: string;
}

export function ExpressionInput({
  value,
  onChange,
  suggestions,
  multiline = false,
  placeholder,
  className,
  helpText,
}: ExpressionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtered, setFiltered] = useState<ExpressionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expressionRange, setExpressionRange] = useState<{ start: number; end: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const detectExpression = useCallback(
    (text: string, cursorPos: number) => {
      const before = text.slice(0, cursorPos);
      const openIdx = before.lastIndexOf('${{');
      if (openIdx === -1) return null;

      const afterOpen = before.slice(openIdx + 3);
      if (afterOpen.includes('}}')) return null;

      const partial = afterOpen.replace(/^\s+/, '');
      const afterCursor = text.slice(cursorPos);
      const closeIdx = afterCursor.indexOf('}}');
      const endPos = closeIdx !== -1 ? cursorPos + closeIdx + 2 : cursorPos;

      return { start: openIdx, end: endPos, partial };
    },
    []
  );

  const handleInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const cursorPos = el.selectionStart ?? 0;
    const result = detectExpression(el.value, cursorPos);

    if (result) {
      const { partial } = result;
      const matches = suggestions.filter(
        (s) =>
          s.label.toLowerCase().includes(partial.toLowerCase()) ||
          s.value.toLowerCase().includes(partial.toLowerCase())
      );
      setFiltered(matches.slice(0, 12));
      setExpressionRange({ start: result.start, end: result.end });
      setShowSuggestions(matches.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setExpressionRange(null);
    }
  }, [suggestions, detectExpression]);

  const insertSuggestion = useCallback(
    (suggestion: ExpressionSuggestion) => {
      const el = inputRef.current;
      if (!el || !expressionRange) return;

      const text = el.value;
      const before = text.slice(0, expressionRange.start);
      const after = text.slice(expressionRange.end);
      const insertion = `\${{ ${suggestion.value} }}`;
      const newValue = before + insertion + after;
      const newCursor = before.length + insertion.length;

      onChange(newValue);
      setShowSuggestions(false);
      setExpressionRange(null);

      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(newCursor, newCursor);
      });
    },
    [expressionRange, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || filtered.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (showSuggestions) {
          e.preventDefault();
          insertSuggestion(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, filtered, selectedIndex, insertSuggestion]
  );

  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const active = suggestionsRef.current.querySelector('[data-active="true"]');
      active?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showSuggestions]);

  const sharedProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      onChange(e.target.value);
      requestAnimationFrame(handleInput);
    },
    onKeyDown: handleKeyDown,
    onClick: () => requestAnimationFrame(handleInput),
    onBlur: () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => setShowSuggestions(false), 200);
    },
    placeholder,
    className: cn(
      'font-mono text-xs bg-background border border-input px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      multiline ? 'py-2 min-h-[80px] resize-y w-full' : 'h-8 w-full',
      className
    ),
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          {...sharedProps}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          {...sharedProps}
        />
      )}

      {helpText && (
        <p className="text-[11px] text-muted-foreground mt-1">{helpText}</p>
      )}

      {showSuggestions && filtered.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-h-[200px] overflow-y-auto border bg-popover shadow-md"
        >
          {filtered.map((s, i) => (
            <button
              key={s.value}
              type="button"
              data-active={i === selectedIndex}
              className={cn(
                'flex items-center justify-between w-full px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors',
                i === selectedIndex && 'bg-accent'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                insertSuggestion(s);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="font-mono font-medium truncate">{s.label}</span>
              {s.description && (
                <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                  {s.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
