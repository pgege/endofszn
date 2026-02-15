import { useCallback, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeEditor } from './code-editor';

interface CodePreviewProps {
  code: string;
  format: 'yaml' | 'json';
  onFormatChange: (format: 'yaml' | 'json') => void;
  onChange?: (code: string) => void;
}

export function CodePreview({ code, format, onFormatChange, onChange }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <Tabs value={format} onValueChange={(v) => onFormatChange(v as 'yaml' | 'json')}>
          <TabsList className="h-6">
            <TabsTrigger value="yaml" className="text-[10px] px-2.5 h-4">YAML</TabsTrigger>
            <TabsTrigger value="json" className="text-[10px] px-2.5 h-4">JSON</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <CodeEditor
          value={code}
          onChange={onChange}
          language={format}
          readOnly={!onChange}
          height="100%"
          className="rounded-none border-0"
        />
      </div>
    </div>
  );
}
