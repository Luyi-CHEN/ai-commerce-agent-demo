import { Suspense } from 'react';
import { AIChatPanel } from '@/components/chat/AIChatPanel';
import { Navbar } from '@/components/ui/Navbar';

export default function ChatPage() {
  return (
    <main className="mx-auto flex h-dvh max-w-7xl flex-col overflow-hidden px-4 py-3 sm:px-5 lg:px-6">
      <Navbar sticky={false} className="mb-3 shrink-0 lg:mb-4" />
      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="glass-panel flex h-full min-h-0 items-center rounded-4xl p-6 text-sm text-slate-600 shadow-soft">
              Loading shopping workspace…
            </div>
          }
        >
          <AIChatPanel />
        </Suspense>
      </div>
    </main>
  );
}
