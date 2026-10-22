'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { calculateShipping, calculateSubtotal, calculateTotal, formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';

interface CartSidebarProps {
  upsells: Product[];
  onOpenProduct: (product: Product) => void;
}

export function CartSidebar({ upsells, onOpenProduct }: CartSidebarProps) {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const addItem = useCartStore((state) => state.addItem);

  const subtotal = calculateSubtotal(items);
  const shipping = calculateShipping(subtotal);
  const total = calculateTotal(items);

  return (
    <aside className="glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-4xl p-5 shadow-soft">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Shopping cart</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{items.length} active line items</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-soft">
          <ShoppingCart size={20} />
        </div>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1">
        <div className="space-y-3 pb-1">
          {items.length === 0 ? (
            <div className="rounded-3xl bg-white p-5 text-sm leading-6 text-slate-600 shadow-soft">
              Your cart is empty. Add any recommended item and the demo will surface complementary products automatically.
            </div>
          ) : (
            items.map((line) => (
              <motion.div layout key={line.product.id} className="rounded-3xl bg-white p-4 shadow-soft">
                <div className="flex gap-4">
                  <button type="button" onClick={() => onOpenProduct(line.product)} className="rounded-2xl bg-slate-50 p-3">
                    <img src={line.product.image} alt={line.product.title} className="h-16 w-16 object-contain" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{line.product.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{line.product.category}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.product.id)}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
                        <button type="button" onClick={() => updateQuantity(line.product.id, line.quantity - 1)} className="rounded-full p-1 text-slate-500 hover:bg-slate-50">
                          <Minus size={14} />
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium text-slate-700">{line.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(line.product.id, line.quantity + 1)} className="rounded-full p-1 text-slate-500 hover:bg-slate-50">
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-slate-950">{formatCurrency(line.product.price * line.quantity)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {upsells.length > 0 ? (
          <div className="mt-6 pb-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Upsell suggestions</p>
            <div className="mt-3 space-y-3">
              {upsells.slice(0, 3).map((product) => (
                <div key={product.id} className="rounded-3xl bg-white p-4 shadow-soft">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => onOpenProduct(product)} className="rounded-2xl bg-slate-50 p-3">
                      <img src={product.image} alt={product.title} className="h-12 w-12 object-contain" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-950">{product.title}</p>
                      <p className="text-xs text-slate-500">{product.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(product, 1)}
                      className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 shrink-0 rounded-3xl bg-slate-950 p-5 text-white shadow-soft">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Shipping</span>
            <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        <Link
          href="/checkout"
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
        >
          Continue to checkout
        </Link>
      </div>
    </aside>
  );
}
