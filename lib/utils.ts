import type { CartLine } from '@/lib/types';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const calculateSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

export const calculateShipping = (subtotal: number) => {
  if (subtotal === 0) return 0;
  if (subtotal >= 250) return 0;
  return 18;
};

export const calculateTotal = (lines: CartLine[]) => {
  const subtotal = calculateSubtotal(lines);
  const shipping = calculateShipping(subtotal);
  return subtotal + shipping;
};

export interface PriceRange {
  min?: number;
  max?: number;
}

const PRICE = String.raw`\$?(\d{2,4})(?:\s*(?:usd|dollars|bucks))?`;

export const extractPriceRange = (message: string): PriceRange => {
  const range =
    message.match(new RegExp(String.raw`(?:between|from)\s*${PRICE}\s*(?:-|–|to|and)\s*${PRICE}`, 'i')) ??
    message.match(new RegExp(String.raw`\$(\d{2,4})\s*(?:-|–|to)\s*\$?(\d{2,4})`, 'i'));
  if (range) {
    const [low, high] = [Number(range[1]), Number(range[2])].sort((a, b) => a - b);
    return { min: low, max: high };
  }

  const around = message.match(new RegExp(String.raw`(?:around|about|roughly|approximately|~)\s*${PRICE}`, 'i'));
  if (around) {
    const target = Number(around[1]);
    return { min: Math.floor(target * 0.85), max: Math.ceil(target * 1.15) };
  }

  const min = message.match(new RegExp(String.raw`(?:over|above|more than|at least|starting at)\s*${PRICE}`, 'i'));
  const max =
    message.match(new RegExp(String.raw`(?:under|below|less than|up to|max(?:imum)?|budget(?: of| is)?|no more than|within|cheaper than)\s*${PRICE}`, 'i')) ??
    (min ? null : message.match(/\$(\d{2,4})/));

  return {
    ...(min ? { min: Number(min[1]) } : {}),
    ...(max ? { max: Number(max[1]) } : {}),
  };
};
