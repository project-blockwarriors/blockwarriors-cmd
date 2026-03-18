'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeBlock({ code, language = 'typescript', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-[#333] overflow-hidden my-4">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
          <span className="text-xs text-gray-500 font-mono">{filename}</span>
          <button
            onClick={handleCopy}
            className="text-gray-500 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
      <div className="relative">
        {!filename && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        <pre className="p-4 bg-[#0d0d0d] overflow-x-auto text-sm leading-relaxed">
          <code className={`language-${language} text-gray-300`}>{code}</code>
        </pre>
      </div>
    </div>
  );
}
