import rawProducts from './nike-jordan-products.json';
import type { Product } from '@/lib/types';

type RawProduct = {
  id: string;
  title: string;
  price: number;
  rating: number | null;
  category: string;
  description: string;
  image: string;
  tags: string[];
};

const dataset = rawProducts as RawProduct[];

const normalizeRating = (item: RawProduct) => {
  if (typeof item.rating === 'number' && Number.isFinite(item.rating)) {
    return item.rating;
  }

  const seed = `${item.id}:${item.title}`;
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10000;
  }

  return Number((7 + (hash % 30) / 10).toFixed(1));
};

const cleanSentence = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Jordan footwear curated from Nike sleeper picks.';
  const [firstSentence] = normalized.split(/(?<=[.!?])\s+/);
  return firstSentence || normalized;
};

const buildSummary = (description: string) => {
  const sentence = cleanSentence(description);
  const words = sentence.split(' ');
  if (words.length <= 16) return sentence;
  return `${words.slice(0, 16).join(' ')}…`;
};

const extractCollection = (title: string, tags: string[]) => {
  const collection = tags.find((tag) => tag.toLowerCase().startsWith('jordan ') && tag.toLowerCase() !== 'jordan');
  if (collection) return collection;
  const match = title.match(/(Jordan [A-Za-z0-9+/ ]+)/);
  return match?.[1] ?? 'Jordan';
};

const buildFitLine = (tags: string[]) => {
  if (tags.includes('Boys') || tags.includes('Girls')) return "Big kids' sizing";
  if (tags.includes('Unisex')) return "Unisex sizing (men's and women's)";
  if (tags.includes('Women')) return "Women's sizing";
  return "Men's sizing";
};

const buildFeatures = (item: RawProduct) => {
  const collection = extractCollection(item.title, item.tags);
  const features = [
    `${collection} signature styling`,
    'Everyday off-court comfort and easy rotation wear',
    buildFitLine(item.tags),
  ];
  if (item.tags.includes('BEST_SELLER')) features.push('Best seller');
  return features;
};

const buildUseCases = (item: RawProduct) => {
  const tags = item.tags.map((tag) => tag.toLowerCase());
  const useCases: string[] = [];

  if (tags.some((tag) => tag.includes('lifestyle'))) {
    useCases.push('daily lifestyle rotation');
  }
  if (tags.some((tag) => tag.includes('trunner'))) {
    useCases.push('all-day walking and light training');
  }
  if (tags.some((tag) => tag.includes('spizike') || tag.includes('sixty plus') || tag.includes('mvp'))) {
    useCases.push('statement sneaker styling');
  }

  useCases.push('streetwear outfits', 'weekend travel');

  return useCases.filter((value, index, array) => array.indexOf(value) === index).slice(0, 3);
};

const productTokens = (item: Pick<Product, 'title' | 'description' | 'tags' | 'summary' | 'useCases'>) => {
  const text = [item.title, item.description, item.summary, ...item.tags, ...item.useCases].join(' ').toLowerCase();
  return new Set(text.split(/[^a-z0-9]+/).filter((token) => token.length > 2));
};

const similarityScore = (left: Product, right: Product) => {
  const leftTokens = productTokens(left);
  const rightTokens = productTokens(right);
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const priceGap = Math.abs(left.price - right.price);
  return overlap * 10 - priceGap / 25;
};

const baseProducts: Product[] = dataset.map((item) => ({
  id: item.id,
  title: item.title,
  price: item.price,
  rating: normalizeRating(item),
  category: 'shoes',
  description: cleanSentence(item.description),
  image: item.image,
  tags: item.tags,
  summary: buildSummary(item.description),
  features: buildFeatures(item),
  useCases: buildUseCases(item),
  upsellIds: [],
}));

export const products: Product[] = baseProducts.map((product) => {
  const rankedProducts = baseProducts
    .filter((candidate) => candidate.id !== product.id)
    .sort((left, right) => similarityScore(product, right) - similarityScore(product, left))
    .slice(0, 2)
    .map((candidate) => candidate.id);

  return {
    ...product,
    upsellIds: rankedProducts,
  };
});
