'use client';

import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
  chatInline?: boolean;
}

export function ProductCard({ product, onAddToCart, onOpenDetail, chatInline = false }: ProductCardProps) {
  const summaryRowClassName = chatInline ? 'flex items-center justify-between gap-2.5' : 'flex items-center justify-between gap-3';
  const actionRowClassName = chatInline ? 'mt-0 flex items-center gap-2' : 'mt-4 flex gap-3';
  const visibleTags = chatInline ? product.tags.slice(0, 2) : product.tags.slice(0, 3);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel flex h-full flex-col shadow-soft ${chatInline ? 'rounded-[1.2rem] p-2.5' : 'rounded-[1.75rem] p-4'}`}
    >
      <button
        type="button"
        onClick={() => onOpenDetail?.(product)}
        className={`group relative overflow-hidden bg-white text-left ${chatInline ? 'rounded-[1.1rem]' : 'rounded-3xl'}`}
      >
        <div className="absolute inset-0 bg-linear-to-br from-sky-100 via-transparent to-violet-100 opacity-80" />
        <img src={product.image} alt={product.title} className={`relative w-full object-contain transition duration-300 group-hover:scale-[1.03] ${chatInline ? 'h-20 p-2.5' : 'h-44 p-6'}`} />
      </button>

      <div className={chatInline ? 'mt-2.5 flex items-start justify-between gap-2.5' : 'mt-4 flex items-start justify-between gap-4'}>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold uppercase tracking-[0.22em] text-slate-500 ${chatInline ? 'text-[9px]' : 'text-xs'}`}>{product.category}</p>
          <h3 className={`mt-1 font-semibold text-slate-950 ${chatInline ? 'text-[13px] leading-4' : 'text-lg'}`}>{product.title}</h3>
        </div>
        <div className={`flex shrink-0 items-center gap-1 rounded-full bg-white font-medium text-slate-700 shadow-soft ${chatInline ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1 text-sm'}`}>
          <Star size={chatInline ? 12 : 14} className="fill-amber-400 text-amber-400" />
          {Number(product.rating ?? 0).toFixed(1)}
        </div>
      </div>

      <div className={chatInline ? 'mt-2 flex flex-wrap gap-1' : 'mt-4 flex flex-wrap gap-2'}>
        {visibleTags.map((tag) => (
          <span key={tag} className={`rounded-full bg-white font-medium text-slate-600 shadow-soft ${chatInline ? 'px-1.5 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className={chatInline ? 'mt-auto pt-2.5' : 'mt-auto pt-5'}>
        <div className={summaryRowClassName}>
          {!chatInline ? (
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Nike summary</p>
              <p className="mt-1 text-sm text-slate-600">{product.summary}</p>
            </div>
          ) : null}
          <p className={`shrink-0 font-semibold text-slate-950 ${chatInline ? 'text-sm' : 'text-xl'}`}>{formatCurrency(product.price)}</p>
        </div>
        <div className={actionRowClassName}>
          {!chatInline ? (
            <button
              type="button"
              onClick={() => onOpenDetail?.(product)}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              View details
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-950 font-medium text-white transition hover:bg-slate-800 ${chatInline ? 'ml-auto px-2.5 py-1.5 text-[11px]' : 'px-4 py-3 text-sm'}`}
          >
            <Plus size={chatInline ? 14 : 16} />
            {chatInline ? 'Add' : 'Add to cart'}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
