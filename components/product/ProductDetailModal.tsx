'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Star, X } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  return (
    <AnimatePresence>
      {product ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="glass-panel relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-4xl p-6 shadow-panel"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full bg-white p-2 text-slate-500 shadow-soft transition hover:text-slate-950"
            >
              <X size={18} />
            </button>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[1.75rem] bg-white p-6 shadow-soft">
                <div className="rounded-3xl bg-linear-to-br from-sky-100 via-white to-violet-100 p-8">
                  <img src={product.image} alt={product.title} className="mx-auto h-72 w-full object-contain" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <img src={product.image} alt={`${product.title} view ${index + 1}`} className="h-20 w-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5 rounded-[1.75rem] bg-white p-6 shadow-soft">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{product.category}</p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    {Number(product.rating ?? 0).toFixed(1)}
                  </div>
                </div>

                <p className="text-lg font-semibold text-slate-950">{formatCurrency(product.price)}</p>
                <p className="text-base leading-7 text-slate-600">{product.description}</p>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Nike AI summary</p>
                  <p className="mt-2 rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{product.summary}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Features</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                      {product.features.map((feature) => (
                        <li key={feature} className="rounded-2xl bg-slate-50 px-4 py-3">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Best use cases</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                      {product.useCases.map((useCase) => (
                        <li key={useCase} className="rounded-2xl bg-slate-50 px-4 py-3">
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-medium text-white transition hover:bg-slate-800"
                >
                  <Plus size={18} />
                  Add to cart
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
