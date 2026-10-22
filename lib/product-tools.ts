import { products } from '@/data/products';
import type { AssistantPlan, CartAction, Product, ProductCategory, ToolCallLog } from '@/lib/types';
import { extractPriceRange, formatCurrency, type PriceRange } from '@/lib/utils';

const categoryKeywords: Record<ProductCategory, string[]> = {
  shoes: ['shoe', 'shoes', 'runner', 'running', 'sneaker', 'trail', 'walk', 'jordan', 'low-top', 'low tops', 'basketball'],
  apparel: ['hoodie', 'jacket', 'tee', 'shirt', 'pants', 'jogger', 'blazer', 'outfit', 'apparel'],
  electronics: ['laptop', 'keyboard', 'mouse', 'desk', 'headphones', 'audio', 'setup', 'electronics'],
  accessories: ['socks', 'bag', 'bottle', 'wallet', 'holder', 'mug', 'accessory', 'travel'],
  fitness: ['fitness', 'gym', 'mat', 'jump rope', 'recovery', 'massage', 'dumbbell', 'training', 'workout'],
};

const complementaryByCategory: Record<ProductCategory, ProductCategory[]> = {
  shoes: ['shoes'],
  apparel: ['accessories', 'shoes'],
  electronics: ['accessories', 'apparel'],
  accessories: ['electronics', 'fitness'],
  fitness: ['accessories', 'apparel'],
};

const availableCategories = new Set(products.map((product) => product.category));

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'or', 'the', 'for', 'with', 'of', 'to', 'in', 'on', 'at', 'is', 'are', 'it', 'this', 'that', 'my', 'me',
  'i', 'you', 'can', 'could', 'would', 'please', 'need', 'want', 'show', 'find', 'recommend', 'get', 'give', 'some', 'any',
  'best', 'good', 'what', 'which', 'looking', 'look', 'under', 'below', 'over', 'above', 'than', 'less', 'more', 'between',
  'around', 'about', 'budget', 'price', 'dollars', 'usd', 'compare', 'vs', 'versus', 'add', 'put', 'cart', 'buy', 'order',
  'pair', 'pairs', 'shoe', 'shoes', 'sneaker', 'sneakers', 'jordan', 'jordans', 'nike',
]);

const KIDS_WORDS = /\b(kid|kids|boy|boys|girl|girls|youth|child|children|son|daughter)\b/i;
const ADD_INTENT = /\b(add|put|throw|grab|buy|order)\b/i;

const normalizeToken = (token: string) => (token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token);

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !/^\d{3,}$/.test(token))
    .map(normalizeToken);

const isKidsProduct = (product: Product) => product.tags.includes('Boys') || product.tags.includes('Girls');
const isBestSeller = (product: Product) => product.tags.includes('BEST_SELLER');

const scoreProduct = (product: Product, queryTokens: string[], wantsKids: boolean) => {
  const titleTokens = new Set(tokenize(product.title));
  const tagTokens = new Set(product.tags.flatMap(tokenize));
  const bodyTokens = new Set(tokenize([product.description, product.summary, ...product.useCases].join(' ')));

  const relevance = [...new Set(queryTokens)].reduce((score, token) => {
    if (titleTokens.has(token)) return score + 5;
    if (tagTokens.has(token)) return score + 3;
    if (bodyTokens.has(token)) return score + 1;
    return score;
  }, 0);

  return relevance - (isKidsProduct(product) !== wantsKids ? 4 : 0);
};

const inPriceRange = (product: Product, { min, max }: PriceRange) =>
  (typeof min !== 'number' || product.price >= min) && (typeof max !== 'number' || product.price <= max);

const dedupeByTitle = (list: Product[]) =>
  list.filter((product, index) => list.findIndex((item) => item.title.toLowerCase() === product.title.toLowerCase()) === index);

export const inferCategory = (message: string): ProductCategory | undefined => {
  const normalized = message.toLowerCase();
  const match = (Object.entries(categoryKeywords) as [ProductCategory, string[]][]).find(
    ([category, keywords]) => availableCategories.has(category) && keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.[0];
};

const findUnavailableCategory = (message: string): ProductCategory | undefined => {
  if (inferCategory(message)) return undefined;
  const normalized = message.toLowerCase();
  const match = (Object.entries(categoryKeywords) as [ProductCategory, string[]][]).find(
    ([category, keywords]) => !availableCategories.has(category) && keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.[0];
};

export const getProductById = (productId: string) => products.find((product) => product.id === productId);

export const getProductsByIds = (productIds: string[]) =>
  productIds.map((id) => getProductById(id)).filter((product): product is Product => Boolean(product));

export interface ProductSearchInput extends PriceRange {
  query?: string;
  category?: ProductCategory;
}

export const searchProducts = ({ query = '', category, min, max }: ProductSearchInput = {}) => {
  const queryTokens = tokenize(query);
  const wantsKids = KIDS_WORDS.test(query);

  return products
    .filter((product) => (category ? product.category === category : true))
    .filter((product) => inPriceRange(product, { min, max }))
    .map((product) => ({ product, score: scoreProduct(product, queryTokens, wantsKids) }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (isBestSeller(right.product) !== isBestSeller(left.product)) return isBestSeller(right.product) ? 1 : -1;
      return right.product.rating - left.product.rating;
    })
    .map((entry) => entry.product);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const titlePattern = (title: string) => new RegExp(`(?<![a-z0-9])${escapeRegExp(title.toLowerCase())}(?![a-z0-9])`);

/** Products named explicitly in the message, longest title first so "Air Jordan X" wins over "Jordan X". */
export const findMentionedProducts = (message: string, range: PriceRange = {}) => {
  let remaining = message.toLowerCase();
  const titles = [...new Set(products.map((product) => product.title))].sort((a, b) => b.length - a.length);
  const found: { index: number; product: Product }[] = [];

  titles.forEach((title) => {
    const match = remaining.match(titlePattern(title));
    if (!match || match.index === undefined) return;
    remaining = `${remaining.slice(0, match.index)}${' '.repeat(title.length)}${remaining.slice(match.index + title.length)}`;
    const variants = products.filter((product) => product.title === title);
    const product = variants.find((variant) => inPriceRange(variant, range)) ?? variants[0];
    if (product) found.push({ index: match.index, product });
  });

  return found.sort((a, b) => a.index - b.index).map((entry) => entry.product);
};

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

const extractQuantity = (message: string, mentioned: Product[]) => {
  const stripped = mentioned.reduce((text, product) => text.replace(titlePattern(product.title), ' '), message.toLowerCase());
  const match =
    stripped.match(/\b(\d{1,2}|one|two|three|four|five)\s*(?:x\b|pairs?\b|items?\b|pieces?\b|units?\b|of\b)/) ??
    stripped.match(/\bx\s*(\d{1,2})\b/) ??
    stripped.match(/\b(?:add|put|grab|buy|order)\s+(\d{1,2}|two|three|four|five)\b/);
  if (!match?.[1]) return 1;
  const value = WORD_NUMBERS[match[1]] ?? Number(match[1]);
  return Math.min(10, Math.max(1, value));
};

const findAddToCartIntent = (message: string, mentioned: Product[]): CartAction | undefined => {
  const product = mentioned[0];
  if (!product || !ADD_INTENT.test(message)) return undefined;
  return { productId: product.id, quantity: extractQuantity(message, mentioned) };
};

export const findComplementaryProducts = (productIds: string[]) => {
  const selectedProducts = getProductsByIds(productIds);
  const selectedTitles = new Set(selectedProducts.map((product) => product.title.toLowerCase()));
  const complementaryCategories = new Set<ProductCategory>();

  selectedProducts.forEach((product) => {
    complementaryByCategory[product.category].forEach((category) => complementaryCategories.add(category));
  });

  const byDirectMapping = getProductsByIds(selectedProducts.flatMap((product) => product.upsellIds));
  const byCategory = products.filter((product) => complementaryCategories.has(product.category));

  return dedupeByTitle([...byDirectMapping, ...byCategory])
    .filter((product) => !productIds.includes(product.id) && !selectedTitles.has(product.title.toLowerCase()))
    .slice(0, 4);
};

const describeRange = ({ min, max }: PriceRange) => {
  if (typeof min === 'number' && typeof max === 'number') return `between ${formatCurrency(min)} and ${formatCurrency(max)}`;
  if (typeof max === 'number') return `under ${formatCurrency(max)}`;
  if (typeof min === 'number') return `over ${formatCurrency(min)}`;
  return '';
};

const primaryUseCase = (product: Product) => product.useCases[0] ?? 'everyday wear';

interface ReplyContext {
  message: string;
  recommendations: Product[];
  upsells: Product[];
  range: PriceRange;
  budgetMiss: boolean;
  isComparison: boolean;
  unavailableCategory?: ProductCategory;
  cartAction?: CartAction;
}

const buildReply = ({ message, recommendations, upsells, range, budgetMiss, isComparison, unavailableCategory, cartAction }: ReplyContext) => {
  const lines: string[] = [];
  const rangeText = describeRange(range);
  const added = cartAction ? getProductById(cartAction.productId) : undefined;

  if (added && cartAction) {
    lines.push(`Done — I added ${cartAction.quantity > 1 ? `${cartAction.quantity}× ` : ''}${added.title} (${formatCurrency(added.price)}) to your cart.`);
  } else if (isComparison && recommendations.length >= 2) {
    const [first, second] = recommendations as [Product, Product];
    const cheaper = first.price <= second.price ? first : second;
    const gap = Math.abs(first.price - second.price);
    lines.push(
      primaryUseCase(first) === primaryUseCase(second)
        ? `Both are great for ${primaryUseCase(first)}: ${first.title} (${formatCurrency(first.price)}) brings ${first.features[0]}, while ${second.title} (${formatCurrency(second.price)}) brings ${second.features[0]}.`
        : `${first.title} (${formatCurrency(first.price)}) is built for ${primaryUseCase(first)}, while ${second.title} (${formatCurrency(second.price)}) leans toward ${primaryUseCase(second)}.`,
      gap > 0 ? `${cheaper.title} saves you ${formatCurrency(gap)}.` : 'They sit at the same price point, so it comes down to style.',
    );
  } else if (unavailableCategory && recommendations[0]) {
    lines.push(
      `We don't carry ${unavailableCategory} in this collection yet, but if you're building a look, ${recommendations[0].title} (${formatCurrency(recommendations[0].price)}) is a strong anchor piece.`,
    );
  } else if (budgetMiss && recommendations[0]) {
    lines.push(
      `Nothing in the current lineup lands ${rangeText}, so here are the closest options — starting with ${recommendations[0].title} at ${formatCurrency(recommendations[0].price)}.`,
    );
  } else if (recommendations[0]) {
    const top = recommendations[0];
    lines.push(
      `${top.title} is the strongest starting point for "${message}" — ${formatCurrency(top.price)}, ideal for ${primaryUseCase(top)}.`,
      `Top picks: ${recommendations.map((product) => `${product.title} (${formatCurrency(product.price)})`).join(', ')}.`,
    );
    if (rangeText) lines.push(`Everything here is ${rangeText}.`);
  } else {
    lines.push(`I couldn't find a match for "${message}" yet — tell me a style, budget, or occasion and I'll narrow it down.`);
  }

  if (upsells.length) {
    lines.push(`To round out the order, I'd pair it with ${upsells.slice(0, 2).map((product) => product.title).join(' or ')}.`);
  }

  lines.push(
    added
      ? 'Want to keep browsing, or head to checkout?'
      : 'If you want, I can narrow this to the best value option, the best performance option, or add one to your cart.',
  );

  return lines.join(' ');
};

export const buildAssistantPlan = (message: string, cartProductIds: string[]): AssistantPlan => {
  const range = extractPriceRange(message);
  const category = inferCategory(message);
  const mentioned = findMentionedProducts(message, range);
  const cartAction = findAddToCartIntent(message, mentioned);

  let recommendations: Product[];
  let budgetMiss = false;

  if (mentioned.length > 0) {
    recommendations = mentioned.slice(0, 2);
  } else {
    recommendations = dedupeByTitle(searchProducts({ query: message, category, ...range })).slice(0, 2);
    if (recommendations.length === 0 && (range.min !== undefined || range.max !== undefined)) {
      budgetMiss = true;
      const target = range.max ?? range.min ?? 0;
      recommendations = dedupeByTitle(searchProducts({ query: message, category }))
        .sort((left, right) => Math.abs(left.price - target) - Math.abs(right.price - target))
        .slice(0, 2);
    }
  }

  const upsells = findComplementaryProducts([...cartProductIds, ...recommendations.map((product) => product.id)]);

  const toolCalls: ToolCallLog[] = [
    {
      tool: 'searchProducts',
      input: { query: message, category: category ?? null, minPrice: range.min ?? null, maxPrice: range.max ?? null },
      result: `${recommendations.length} relevant products shortlisted`,
    },
    {
      tool: 'recommendProducts',
      input: { category: category ?? recommendations[0]?.category ?? null },
      result: `${upsells.length} complementary items prepared`,
    },
  ];

  if (cartAction) {
    const product = getProductById(cartAction.productId);
    toolCalls.push({
      tool: 'addToCart',
      input: { productId: cartAction.productId, quantity: cartAction.quantity },
      result: product ? `${product.title} prepared for cart addition` : 'Requested product matched for cart action',
    });
  }

  return {
    reply: buildReply({
      message,
      recommendations,
      upsells,
      range,
      budgetMiss,
      isComparison: mentioned.length >= 2,
      unavailableCategory: findUnavailableCategory(message),
      cartAction,
    }),
    recommendations,
    upsells,
    toolCalls,
    cartAction,
  };
};
