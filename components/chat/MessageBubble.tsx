'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { ChatMessage, Product } from '@/lib/types';

interface MessageBubbleProps {
  message: ChatMessage;
  onAddToCart?: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
}

export function MessageBubble({ message, onAddToCart, onOpenDetail }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const hasRecommendations = isAssistant && (message.recommendations?.length ?? 0) > 0;
  const assistantStatus = isAssistant ? (message.status ?? (message.content.trim() ? 'done' : 'thinking')) : 'done';
  const isThinking = isAssistant && assistantStatus === 'thinking';
  const isTyping = isAssistant && assistantStatus === 'typing';
  const isStreaming = isThinking || isTyping;
  const contentBlocks = message.content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {isAssistant ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
          <Bot size={18} />
        </div>
      ) : null}
      <div className={isAssistant ? 'w-full max-w-[min(42rem,82%)]' : 'max-w-[85%]'}>
        <div
          className={`rounded-[1.6rem] text-sm shadow-soft ${
            isAssistant
              ? `glass-panel w-full text-slate-700 ${
                  isStreaming
                    ? 'min-h-[78px] px-5 py-4 text-[15px] leading-7 md:min-h-[88px] md:px-6'
                    : 'min-h-[64px] px-4 py-3 leading-[1.72]'
                }`
              : 'bg-slate-950 px-4 py-3 leading-[1.72] text-white'
          }`}
          style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
        >
          {isThinking ? (
            <div className="inline-flex min-h-7 items-center gap-2 text-slate-500">
              <span>Thinking…</span>
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </span>
            </div>
          ) : isTyping ? (
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{message.content}</p>
          ) : contentBlocks.length > 0 ? (
            <div className="space-y-2.5">
              {contentBlocks.map((block, index) => (
                <p key={`${message.id}_${index}`} className="text-pretty">
                  {block}
                </p>
              ))}
            </div>
          ) : message.content ? (
            <p className="text-pretty">{message.content}</p>
          ) : (
            ''
          )}
        </div>

        {hasRecommendations ? (
          <div className="mt-3 rounded-[1.4rem] border border-slate-200/70 bg-white/90 p-3 shadow-soft">
            <ProductGrid
              title="Recommended in this reply"
              subtitle="Quick picks to compare without breaking the chat flow."
              products={message.recommendations ?? []}
              onAddToCart={onAddToCart}
              onOpenDetail={onOpenDetail}
              chatInline
            />
          </div>
        ) : null}

      </div>
      {!isAssistant ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-soft">
          <User size={18} />
        </div>
      ) : null}
    </motion.div>
  );
}
