'use client';

import { ArrowUpRight } from 'lucide-react';
import { FormEvent, KeyboardEvent, useState } from 'react';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function ChatComposer({ value, onChange, onSubmit, loading }: ChatComposerProps) {
  const [isComposing, setIsComposing] = useState(false);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (loading || isComposing) return;
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="rounded-[1.2rem] border border-slate-200/80 bg-white px-2.5 py-2 shadow-soft sm:px-3 sm:py-2.5">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={1}
        placeholder="Ask for products, budgets, or add-to-cart actions"
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        className="max-h-24 min-h-[36px] w-full resize-none border-0 bg-transparent text-sm leading-5 text-slate-900 outline-hidden placeholder:text-slate-400 sm:text-[15px]"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500 sm:text-xs">Enter to send · Shift+Enter for a new line</p>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3.5"
        >
          {loading ? 'Streaming…' : 'Send'}
          <ArrowUpRight size={14} />
        </button>
      </div>
    </form>
  );
}
