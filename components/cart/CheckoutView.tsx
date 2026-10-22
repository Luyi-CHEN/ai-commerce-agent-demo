'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { calculateShipping, calculateSubtotal, calculateTotal, createId, formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';

export function CheckoutView() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirmedLines, setConfirmedLines] = useState(items);

  const activeLines = orderId ? confirmedLines : items;
  const subtotal = useMemo(() => calculateSubtotal(activeLines), [activeLines]);
  const shipping = useMemo(() => calculateShipping(subtotal), [subtotal]);
  const total = useMemo(() => calculateTotal(activeLines), [activeLines]);

  const placeOrder = () => {
    if (items.length === 0) return;
    setConfirmedLines(items);
    setOrderId(createId('order').toUpperCase());
    clearCart();
  };

  if (activeLines.length === 0 && !orderId) {
    return (
      <section className="glass-panel rounded-4xl p-10 text-center shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Mock checkout</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Your cart is empty</h2>
        <p className="mt-4 text-base leading-7 text-slate-600">Add products from the chat workspace first, then come back here to complete the fake checkout flow.</p>
        <Link href="/chat" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
          Return to chat
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass-panel rounded-4xl p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Mock checkout</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Complete the premium commerce journey</h2>
        <div className="mt-6 space-y-4">
          {activeLines.map((line) => (
            <div key={line.product.id} className="rounded-3xl bg-white p-4 shadow-soft">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <img src={line.product.image} alt={line.product.title} className="h-16 w-16 object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{line.product.title}</p>
                      <p className="text-sm text-slate-500">Quantity: {line.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(line.product.price * line.quantity)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{line.product.summary}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="glass-panel rounded-4xl p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Order summary</p>
          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between text-base font-semibold text-slate-950">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {orderId ? (
            <div className="mt-6 rounded-3xl bg-emerald-50 p-5 text-emerald-900 shadow-soft">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 text-emerald-600" size={20} />
                <div>
                  <p className="font-semibold">Order confirmed</p>
                  <p className="mt-1 text-sm leading-6">Your mock checkout completed successfully. Reference: {orderId}</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={placeOrder}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Confirm mock checkout
            </button>
          )}
        </div>

        <div className="glass-panel rounded-4xl p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">What this demo proves</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>• Conversational discovery can drive product selection faster than catalog navigation alone.</li>
            <li>• Upsell logic can increase cart value without complex backend systems.</li>
            <li>• Premium UX can be delivered with mocked local data and clear frontend state management.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
