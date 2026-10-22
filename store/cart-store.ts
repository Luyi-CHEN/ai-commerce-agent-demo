'use client';

import { create } from 'zustand';
import type { CartLine, Product } from '@/lib/types';

interface CartState {
  items: CartLine[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((line) => line.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line,
          ),
        };
      }

      return { items: [...state.items, { product, quantity }] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((line) => line.product.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((line) => line.product.id !== productId)
          : state.items.map((line) => (line.product.id === productId ? { ...line, quantity } : line)),
    })),
  clearCart: () => set({ items: [] }),
}));
