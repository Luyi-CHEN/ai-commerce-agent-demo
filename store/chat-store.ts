'use client';

import { create } from 'zustand';
import type { AssistantPlan, ChatMessage, Product, ToolCallLog } from '@/lib/types';
import { createId } from '@/lib/utils';

const createWelcomeMessage = (): ChatMessage => ({
  id: 'welcome_message',
  role: 'assistant',
  content:
    'Welcome to Nike. Tell me what you want to buy, your budget, or the style you are after, and I will curate the fastest path to checkout.',
  timestamp: new Date().toISOString(),
  status: 'done',
});

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  recommendations: Product[];
  upsells: Product[];
  toolCalls: ToolCallLog[];
  addUserMessage: (content: string) => void;
  startAssistantMessage: () => string;
  updateAssistantMessage: (messageId: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  applyAssistantPlan: (messageId: string, plan: AssistantPlan) => void;
  resetConversation: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [createWelcomeMessage()],
  loading: false,
  recommendations: [],
  upsells: [],
  toolCalls: [],
  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: createId('user'),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
          status: 'done',
        },
      ],
    })),
  startAssistantMessage: () => {
    const messageId = createId('assistant');
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          status: 'thinking',
        },
      ],
    }));
    return messageId;
  },
  updateAssistantMessage: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content,
              timestamp: new Date().toISOString(),
              status: content.trim() ? 'typing' : 'thinking',
            }
          : message,
      ),
    })),
  setLoading: (loading) => set({ loading }),
  applyAssistantPlan: (messageId, plan) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: plan.reply,
              timestamp: new Date().toISOString(),
              status: 'done',
              recommendations: plan.recommendations,
              toolCalls: plan.toolCalls,
            }
          : message,
      ),
      recommendations: plan.recommendations,
      upsells: plan.upsells,
      toolCalls: plan.toolCalls,
    })),
  resetConversation: () =>
    set({
      messages: [createWelcomeMessage()],
      loading: false,
      recommendations: [],
      upsells: [],
      toolCalls: [],
    }),
}));
