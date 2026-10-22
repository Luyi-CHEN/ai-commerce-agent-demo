'use client';

import { motion } from 'framer-motion';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {prompts.map((prompt, index) => (
        <motion.button
          key={prompt}
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-sm text-slate-700 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  );
}
