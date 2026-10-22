'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, ShieldCheck, Truck } from 'lucide-react';
import { SuggestedPrompts } from '@/components/chat/SuggestedPrompts';

interface HeroProps {
  prompts: string[];
}

export function Hero({ prompts }: HeroProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const startShopping = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) return;
    router.push(`/chat?q=${encodeURIComponent(nextValue)}`);
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="glass-panel overflow-hidden rounded-4xl border border-white/60 bg-glow px-6 py-8 shadow-panel sm:px-10 sm:py-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-soft">
          <ShieldCheck size={16} className="text-brand" />
          AI-native shopping flow for modern ecommerce
        </div>
        <div className="mt-6 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Nike AI Shopping Assistant</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            What are you shopping for today?
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Explore a premium commerce experience with conversational product discovery, persuasive recommendations, cart upsells,
            and mock checkout — all from a clean, fast, frontend-first experience.
          </p>
        </div>

        <form
          className="mt-8 flex flex-col gap-3 rounded-[1.75rem] bg-white p-4 shadow-soft sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            startShopping(query);
          }}
        >
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-slate-300">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask for products, budgets, or bundles"
              className="w-full border-0 bg-transparent text-base text-slate-900 outline-hidden placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-base font-medium text-white transition hover:bg-slate-800"
          >
            Start shopping
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6">
          <SuggestedPrompts prompts={prompts} onSelect={startShopping} />
        </div>
      </div>

      <aside className="grid gap-4">
        <div className="glass-panel rounded-4xl p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Highlights</p>
          <div className="mt-5 grid gap-4">
            <div className="rounded-3xl bg-white p-5 shadow-soft">
              <p className="text-sm text-slate-500">AI shopping chat</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">Concierge recommendations with tool simulation</h3>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-soft">
              <p className="text-sm text-slate-500">Cart flow</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">Upsells, quantity updates, shipping, and mock checkout</h3>
            </div>
            <div className="flex items-center gap-3 rounded-3xl bg-slate-950 p-5 text-white shadow-soft">
              <Truck size={20} className="text-sky-300" />
              <p className="text-sm leading-6 text-slate-100">Free shipping unlocks automatically once the cart reaches $250.</p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
