'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { SuggestedPrompts } from '@/components/chat/SuggestedPrompts';
import { ProductDetailModal } from '@/components/product/ProductDetailModal';
import { suggestedPrompts } from '@/data/prompts';
import { buildAssistantPlan, findComplementaryProducts, getProductById } from '@/lib/product-tools';
import type { AssistantPlan, Product } from '@/lib/types';
import { sleep } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import { useChatStore } from '@/store/chat-store';

const splitReplyIntoParagraphs = (reply: string) =>
  reply
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, ' ').replace(/\n+/g, ' ').trim())
    .filter(Boolean);

const splitParagraphIntoWords = (paragraph: string) => paragraph.match(/\S+/g) ?? [];

const splitParagraphIntoChunks = (paragraph: string) => {
  const words = splitParagraphIntoWords(paragraph);

  if (words.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let currentWords: string[] = [];
  let currentLength = 0;

  words.forEach((word, index) => {
    currentWords.push(word);
    currentLength += word.length + (currentWords.length > 1 ? 1 : 0);

    const isLastWord = index === words.length - 1;
    const strongPause = /[!?]$/.test(word);
    const softPause = /[,:;.]$/.test(word);
    const reachedTarget = currentWords.length >= 3 && currentLength >= 28;
    const reachedUpperBound = currentWords.length >= 6 || currentLength >= 42;

    if (isLastWord || strongPause || reachedUpperBound || (softPause && reachedTarget) || reachedTarget) {
      chunks.push(currentWords.join(' '));
      currentWords = [];
      currentLength = 0;
    }
  });

  return chunks;
};

const getChunkPause = (chunk: string, chunkIndex: number, chunksInParagraph: number, hasNextParagraph: boolean) => {
  const starterPause = chunkIndex === 0 ? 96 : 78;
  const lengthPause = Math.min(70, Math.max(0, chunk.length - 16) * 2);
  const punctuationPause = /[!?]$/.test(chunk)
    ? 160
    : /[.:;]$/.test(chunk)
      ? 120
      : /[,]$/.test(chunk)
        ? 72
        : 0;
  const paragraphPause = chunkIndex === chunksInParagraph - 1 && hasNextParagraph ? 180 : 0;

  return starterPause + lengthPause + punctuationPause + paragraphPause;
};

const THINKING_DELAY_MS = 650;
const FIRST_RECOMMENDATION_DELAY_MS = 640;
const BETWEEN_RECOMMENDATIONS_DELAY_MS = 1400;
const PROMPTS_DELAY_AFTER_RECOMMENDATIONS_MS = 2000;

export function AIChatPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedInitialQuery = useRef<string | null>(null);
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const messages = useChatStore((state) => state.messages);
  const loading = useChatStore((state) => state.loading);
  const upsells = useChatStore((state) => state.upsells);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const startAssistantMessage = useChatStore((state) => state.startAssistantMessage);
  const updateAssistantMessage = useChatStore((state) => state.updateAssistantMessage);
  const applyAssistantPlan = useChatStore((state) => state.applyAssistantPlan);
  const setLoading = useChatStore((state) => state.setLoading);
  const resetConversation = useChatStore((state) => state.resetConversation);

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  const fallbackUpsells = useMemo(
    () => (cartItems.length > 0 ? findComplementaryProducts(cartItems.map((line) => line.product.id)) : []),
    [cartItems],
  );

  const visibleUpsells = upsells.length > 0 ? upsells : fallbackUpsells;
  const hasUserMessages = messages.some((message) => message.role === 'user');
  const showSuggestedPrompts = hasUserMessages && !loading;

  const streamAssistantReply = useCallback(
    async (messageId: string, reply: string) => {
      const paragraphs = splitReplyIntoParagraphs(reply);

      if (paragraphs.length === 0) {
        updateAssistantMessage(messageId, reply);
        return;
      }

      let typedParagraphs: string[] = [];

      for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex += 1) {
        const paragraph = paragraphs[paragraphIndex] ?? '';
        const chunks = splitParagraphIntoChunks(paragraph);

        if (chunks.length === 0) {
          continue;
        }

        let currentParagraph = '';
        typedParagraphs = typedParagraphs.slice(0, paragraphIndex);

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          currentParagraph = currentParagraph ? `${currentParagraph} ${chunks[chunkIndex]}` : (chunks[chunkIndex] ?? '');
          const nextParagraphs = [...typedParagraphs, currentParagraph];
          updateAssistantMessage(messageId, nextParagraphs.join('\n\n'));

          const isLastChunk = chunkIndex === chunks.length - 1;
          if (!isLastChunk) {
            await sleep(getChunkPause(chunks[chunkIndex] ?? '', chunkIndex, chunks.length, paragraphIndex < paragraphs.length - 1));
          }
        }

        typedParagraphs = [...typedParagraphs, paragraph];

        if (paragraphIndex < paragraphs.length - 1) {
          await sleep(210);
        }
      }
    },
    [updateAssistantMessage],
  );

  const revealAssistantPlan = useCallback(
    async (messageId: string, plan: AssistantPlan) => {
      if (plan.recommendations.length === 0) {
        await sleep(220);
        applyAssistantPlan(messageId, plan);
        return;
      }

      for (let index = 0; index < plan.recommendations.length; index += 1) {
        await sleep(index === 0 ? FIRST_RECOMMENDATION_DELAY_MS : BETWEEN_RECOMMENDATIONS_DELAY_MS);
        applyAssistantPlan(messageId, {
          ...plan,
          recommendations: plan.recommendations.slice(0, index + 1),
        });
      }

      await sleep(PROMPTS_DELAY_AFTER_RECOMMENDATIONS_MS);
    },
    [applyAssistantPlan],
  );

  const sendMessage = useCallback(
    async (rawInput: string) => {
      const message = rawInput.trim();
      if (!message || loading) return;

      setDraft('');
      addUserMessage(message);
      setLoading(true);
      await sleep(90);
      const assistantMessageId = startAssistantMessage();

      try {
        const plan = buildAssistantPlan(
          message,
          cartItems.map((line) => line.product.id),
        );
        await sleep(THINKING_DELAY_MS);
        if (plan.cartAction) {
          const product = getProductById(plan.cartAction.productId);
          if (product) {
            addItem(product, plan.cartAction.quantity);
          }
        }
        await streamAssistantReply(assistantMessageId, plan.reply);
        await revealAssistantPlan(assistantMessageId, plan);
      } catch {
        const fallback = 'I hit a temporary issue while shaping the response, but I can still help you refine the cart and shortlist locally.';
        await streamAssistantReply(assistantMessageId, fallback);
        await sleep(220);
        applyAssistantPlan(assistantMessageId, {
          reply: fallback,
          recommendations: [],
          upsells: fallbackUpsells,
          toolCalls: [],
        });
      } finally {
        setLoading(false);
      }
    },
    [addItem, addUserMessage, applyAssistantPlan, cartItems, fallbackUpsells, loading, revealAssistantPlan, setLoading, startAssistantMessage, streamAssistantReply],
  );

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (!initialQuery || processedInitialQuery.current === initialQuery || loading) {
      return;
    }

    processedInitialQuery.current = initialQuery;
    router.replace('/chat', { scroll: false });
    void sendMessage(initialQuery);
  }, [loading, router, searchParams, sendMessage]);

  useEffect(() => {
    const viewport = messageViewportRef.current;
    if (!viewport) return;

    viewport.scrollTop = viewport.scrollHeight;
  }, [messages, loading]);

  return (
    <>
      <section className="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1 lg:gap-5">
        <div className="glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-4xl shadow-soft">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">AI shopping chat</p>
              <h2 className="mt-1 text-[1.65rem] font-semibold tracking-tight text-slate-950 lg:text-[1.8rem]">Premium sales concierge</h2>
            </div>
            <button
              type="button"
              onClick={resetConversation}
              disabled={loading}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          <div ref={messageViewportRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onAddToCart={(product) => addItem(product, 1)}
                    onOpenDetail={setSelectedProduct}
                  />
                ))}
              </div>
            ) : null}

            {showSuggestedPrompts ? (
              <div className={messages.length > 0 ? 'mt-6' : ''}>
                <div className="rounded-3xl bg-white p-4 shadow-soft">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-brand" />
                    <p className="text-sm font-semibold text-slate-900">Suggested prompts</p>
                  </div>
                  <div className="mt-3">
                    <SuggestedPrompts prompts={suggestedPrompts} onSelect={(prompt) => void sendMessage(prompt)} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-slate-200/70 bg-white/70 px-2.5 py-2 backdrop-blur-sm sm:px-4 sm:py-2.5">
            <ChatComposer value={draft} onChange={setDraft} onSubmit={() => void sendMessage(draft)} loading={loading} />
          </div>
        </div>

        <div className="min-h-0">
          <CartSidebar upsells={visibleUpsells} onOpenProduct={setSelectedProduct} />
        </div>
      </section>

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={(product) => addItem(product, 1)} />
    </>
  );
}
