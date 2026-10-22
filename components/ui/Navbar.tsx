import Link from 'next/link';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface NavbarProps {
  sticky?: boolean;
  className?: string;
}

export function Navbar({ sticky = true, className }: NavbarProps) {
  const headerClassName = [
    'glass-panel rounded-3xl px-4 py-3 shadow-soft',
    sticky ? 'sticky top-4 z-30 mb-8' : 'z-30',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClassName}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Nike</p>
            <h1 className="text-base font-semibold text-slate-950 md:text-lg">Nike AI Commerce Agent</h1>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Link className="rounded-full px-3 py-1.5 transition hover:bg-white hover:text-slate-950" href="/">
            Home
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:bg-white hover:text-slate-950" href="/chat">
            Chat
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:bg-white hover:text-slate-950" href="/checkout">
            Checkout
          </Link>
          <div className="hidden items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-white md:flex">
            <Sparkles size={16} />
            Premium concierge mode
          </div>
        </nav>
      </div>
    </header>
  );
}
