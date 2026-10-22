import { products } from '@/data/products';
import type { AssistantPlan, CartAction, CartLine, Product, ProductCategory, ToolCallLog } from '@/lib/types';
import { calculateShipping, calculateSubtotal, extractPriceRange, formatCurrency, type PriceRange } from '@/lib/utils';

const FREE_SHIPPING_THRESHOLD = 250;

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
const WOMEN_WORDS = /\b(women'?s?|woman|ladies|lady|female|wife|girlfriend|mom|mum|mother|sister|her)\b/i;
const MEN_WORDS = /\b(men'?s?|man|male|husband|boyfriend|dad|father|brother|him)\b/i;
const CHEAP_WORDS = /\b(cheapest|cheaper|lowest price|least expensive|most affordable|affordable|inexpensive|budget[- ]friendly|best value|good value|value for money|bargain)\b/i;
const PRICEY_WORDS = /\b(most expensive|priciest|top[- ]of[- ]the[- ]line|high[- ]end|flagship|splurge)\b/i;
const SIZE_WORDS = /\bsize\s*\d|\b(?:what|which|my) size\b|\bsizing\b|\bsizes\b|\btrue to size\b|\bhow (?:does|do) (?:it|they) fit\b/i;

const GREETING = /^(?:hi|hello|hey|hiya|yo|howdy|good (?:morning|afternoon|evening))(?:\s+there)?[\s!.,]*$/i;
const THANKS = /^(?:thanks|thank you|thx|ty|cheers|great|perfect|awesome|cool|nice|ok|okay|got it)(?:\s+(?:so much|a lot|very much))?[\s!.,]*$/i;

const ADD_INTENT = /\b(add|put|throw|grab|buy|order|purchase|get me|i'?ll (?:take|have|get))\b/i;
const COMPARE_INTENT = /\b(compare|comparison|side by side|difference|differences|vs|versus)\b/i;
const REMOVE_INTENT = /\b(remove|delete|take (?:it |them )?(?:out|off)|get rid of|don'?t want)\b/i;
const CLEAR_INTENT = /\b(?:clear|empty|reset)\s+(?:my\s+|the\s+)?(?:cart|bag)\b|\bremove (?:everything|all items)\b/i;
const CHECKOUT_INTENT =
  /\b(checkout|check out(?!\s+(?:the|these|this|those|some|our|your|a|an|what|more|other)\b)|proceed to (?:checkout|payment)|go to (?:the )?(?:checkout|payment)|ready to (?:pay|check ?out)|place (?:the|my|an) order|pay now)\b/i;
const REFERENCE = /\b(it|them|both|all of them|that one|this one|these|those|the (?:first|second|1st|2nd|last|other|cheaper|cheapest|pricier|more expensive)(?: one| pair)?)\b/i;
const BARE_ADD = /\badd (?:to|into) (?:my |the )?(?:cart|bag)\b/i;

type Audience = 'women' | 'men' | undefined;
type SortOrder = 'asc' | 'desc' | undefined;

const normalizeToken = (token: string) => (token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token);

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !/^\d{3,}$/.test(token))
    .map(normalizeToken);

const isKidsProduct = (product: Product) => product.tags.includes('Boys') || product.tags.includes('Girls');
const isBestSeller = (product: Product) => product.tags.includes('BEST_SELLER');
const fitsAudience = (product: Product, audience: Audience) =>
  !audience || product.tags.includes(audience === 'women' ? 'Women' : 'Men');

const relevanceScore = (product: Product, queryTokens: string[]) => {
  const titleTokens = new Set(tokenize(product.title));
  const tagTokens = new Set(product.tags.flatMap(tokenize));
  const bodyTokens = new Set(tokenize([product.description, product.summary, ...product.useCases].join(' ')));

  return [...new Set(queryTokens)].reduce((score, token) => {
    if (titleTokens.has(token)) return score + 5;
    if (tagTokens.has(token)) return score + 3;
    if (bodyTokens.has(token)) return score + 1;
    return score;
  }, 0);
};

const inPriceRange = (product: Product, { min, max }: PriceRange) =>
  (typeof min !== 'number' || product.price >= min) && (typeof max !== 'number' || product.price <= max);

const dedupeByTitle = (list: Product[]) =>
  list.filter((product, index) => list.findIndex((item) => item.title.toLowerCase() === product.title.toLowerCase()) === index);

const inferCategory = (message: string): ProductCategory | undefined => {
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

const getProductsByIds = (productIds: string[]) =>
  productIds.map((id) => getProductById(id)).filter((product): product is Product => Boolean(product));

interface SearchInput extends PriceRange {
  query: string;
  category?: ProductCategory;
  audience?: Audience;
  wantsKids: boolean;
  sort?: SortOrder;
}

const searchProducts = ({ query, category, min, max, audience, wantsKids, sort }: SearchInput) => {
  const queryTokens = tokenize(query);

  return products
    .filter((product) => (category ? product.category === category : true))
    .filter((product) => inPriceRange(product, { min, max }))
    .filter((product) => fitsAudience(product, audience))
    .map((product) => ({
      product,
      score: relevanceScore(product, queryTokens) - (isKidsProduct(product) !== wantsKids ? 4 : 0),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (sort && left.product.price !== right.product.price) {
        return sort === 'asc' ? left.product.price - right.product.price : right.product.price - left.product.price;
      }
      if (isBestSeller(right.product) !== isBestSeller(left.product)) return isBestSeller(right.product) ? 1 : -1;
      return right.product.rating - left.product.rating;
    })
    .map((entry) => entry.product);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const phrasePattern = (phrase: string) => new RegExp(`(?<![a-z0-9])${escapeRegExp(phrase)}(?![a-z0-9])`);

// Shoppers rarely type the full catalog title, so "Trunner LX" or "Son of Mars" must resolve too.
const productAliases = (() => {
  const aliasToTitles = new Map<string, Set<string>>();
  const familyToTitles = new Map<string, Set<string>>();
  new Set(products.map((product) => product.title)).forEach((title) => {
    const short = title.replace(/^(?:air\s+)?jordan\s+/i, '');
    [title, short, short.replace(/\s+low\b/i, '')].forEach((alias) => {
      const key = alias.toLowerCase().trim();
      if (key.length < 3) return;
      if (!aliasToTitles.has(key)) aliasToTitles.set(key, new Set());
      aliasToTitles.get(key)?.add(title);
    });
    const family = short.split(' ')[0]!.toLowerCase();
    if (!familyToTitles.has(family)) familyToTitles.set(family, new Set());
    familyToTitles.get(family)?.add(title);
  });
  familyToTitles.forEach((titles, family) => {
    if (family.length >= 4 && titles.size === 1 && !aliasToTitles.has(family)) aliasToTitles.set(family, titles);
  });
  return [...aliasToTitles.entries()]
    .map(([alias, titles]) => ({ pattern: phrasePattern(alias), length: alias.length, titles: [...titles] }))
    .sort((left, right) => right.length - left.length);
})();

const pickVariant = (titles: string[], range: PriceRange, wantsKids: boolean) => {
  const rank = (product: Product) =>
    (inPriceRange(product, range) ? 4 : 0) + (isKidsProduct(product) === wantsKids ? 2 : 0) + (isBestSeller(product) ? 1 : 0);
  return products.filter((product) => titles.includes(product.title)).sort((left, right) => rank(right) - rank(left))[0];
};

/** Products named in the message (in order of appearance) plus the message with those names blanked out. */
const findMentionedProducts = (message: string, range: PriceRange) => {
  let rest = message.toLowerCase();
  const wantsKids = KIDS_WORDS.test(rest.replace(/son of mars/g, ''));
  const found: { index: number; product: Product }[] = [];

  productAliases.forEach(({ pattern, length, titles }) => {
    const match = rest.match(pattern);
    if (!match || match.index === undefined) return;
    rest = `${rest.slice(0, match.index)}${' '.repeat(length)}${rest.slice(match.index + length)}`;
    const product = pickVariant(titles, range, wantsKids);
    if (product && !found.some((entry) => entry.product.title === product.title)) found.push({ index: match.index, product });
  });

  return { mentioned: found.sort((a, b) => a.index - b.index).map((entry) => entry.product), rest };
};

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

const extractQuantity = (text: string) => {
  const match =
    text.match(/\b(\d{1,2}|one|two|three|four|five)\s*(?:x\b|pairs?\b|items?\b|pieces?\b|units?\b|of\b)/) ??
    text.match(/\bx\s*(\d{1,2})\b/) ??
    text.match(/\b(?:add|put|grab|buy|order|take|get me)\s+(\d{1,2}|two|three|four|five)\b/);
  if (!match?.[1]) return 1;
  const value = WORD_NUMBERS[match[1]] ?? Number(match[1]);
  return Math.min(10, Math.max(1, value));
};

const resolveReference = (text: string, candidates: Product[]): Product[] => {
  if (candidates.length === 0) return [];
  if (/\b(both|them|all of them|these|those)\b/i.test(text)) return candidates;
  if (/\b(second|2nd|other|last)\b/i.test(text)) return [candidates[1] ?? candidates[candidates.length - 1]!];
  if (/\b(cheaper|cheapest)\b/i.test(text)) return [[...candidates].sort((a, b) => a.price - b.price)[0]!];
  if (/\b(pricier|more expensive)\b/i.test(text)) return [[...candidates].sort((a, b) => b.price - a.price)[0]!];
  return [candidates[0]!];
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

const describeAudience = (audience: Audience, wantsKids: boolean) => {
  if (wantsKids) return 'for the kids';
  if (audience === 'women') return 'for her';
  if (audience === 'men') return 'for him';
  return '';
};

const primaryUseCase = (product: Product) =>
  product.useCases.find((useCase) => useCase !== 'daily lifestyle rotation') ?? product.useCases[0] ?? 'everyday wear';

const pitch = (product: Product) =>
  `${isBestSeller(product) ? 'a best seller' : 'a strong choice'} for ${primaryUseCase(product)}`;

const listTitles = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

const pluralize = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const describeCart = (cart: CartLine[]) => {
  const subtotal = calculateSubtotal(cart);
  const units = cart.reduce((sum, line) => sum + line.quantity, 0);
  const shipping = calculateShipping(subtotal);
  const shippingNote =
    shipping === 0
      ? 'shipping is free'
      : `you're ${formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} away from free shipping`;
  return `Your cart now has ${pluralize(units, 'item')} at ${formatCurrency(subtotal)} — ${shippingNote}.`;
};

const upsellLine = (upsells: Product[]) =>
  upsells.length
    ? `If you want a second pair in the rotation, ${upsells.slice(0, 2).map((product) => product.title).join(' or ')} would pair well.`
    : '';

const bestSellers = (wantsKids: boolean, audience: Audience) =>
  dedupeByTitle(searchProducts({ query: '', wantsKids, audience }).filter(isBestSeller)).slice(0, 2);

const applyCartActions = (cart: CartLine[], actions: CartAction[]) =>
  actions.reduce<CartLine[]>((lines, action) => {
    if (action.type === 'clear') return [];
    if (action.type === 'remove') return lines.filter((line) => line.product.id !== action.productId);
    const existing = lines.find((line) => line.product.id === action.product.id);
    return existing
      ? lines.map((line) => (line === existing ? { ...line, quantity: line.quantity + action.quantity } : line))
      : [...lines, { product: action.product, quantity: action.quantity }];
  }, cart);

const searchToolCall = (query: string, category: ProductCategory | undefined, range: PriceRange, count: number): ToolCallLog => ({
  tool: 'searchProducts',
  input: { query, category: category ?? null, minPrice: range.min ?? null, maxPrice: range.max ?? null },
  result: `${count} relevant products shortlisted`,
});

export interface AgentContext {
  cart: CartLine[];
  lastRecommendations: Product[];
}

const pickOpener = (message: string) => ['My top pick', 'The one I’d start with', 'Best match'][message.length % 3]!;

export const buildAssistantPlan = (rawMessage: string, { cart, lastRecommendations }: AgentContext): AssistantPlan => {
  const message = rawMessage.trim();
  const cartIds = cart.map((line) => line.product.id);

  if (GREETING.test(message)) {
    return {
      reply:
        'Hi there! I’m your Nike shopping concierge. Tell me who you’re shopping for, your budget, or a style you like — for example, “Jordan low-tops under $150 for her” — and I’ll pull together the best options.',
      recommendations: [],
      upsells: findComplementaryProducts(cartIds),
      toolCalls: [],
    };
  }

  if (THANKS.test(message)) {
    return {
      reply: cart.length
        ? 'You’re welcome! Want to keep browsing, or shall I take you to checkout?'
        : 'You’re welcome! Anything else I can find for you?',
      recommendations: [],
      upsells: findComplementaryProducts(cartIds),
      toolCalls: [],
    };
  }

  const range = extractPriceRange(message);
  const { mentioned, rest } = findMentionedProducts(message, range);
  const wantsKids = KIDS_WORDS.test(rest);
  const audience: Audience = wantsKids ? undefined : WOMEN_WORDS.test(rest) ? 'women' : MEN_WORDS.test(rest) ? 'men' : undefined;
  const sort: SortOrder = CHEAP_WORDS.test(rest) ? 'asc' : PRICEY_WORDS.test(rest) ? 'desc' : undefined;
  const category = inferCategory(rest);
  const asksSize = SIZE_WORDS.test(rest);

  const cartActions: CartAction[] = [];
  const toolCalls: ToolCallLog[] = [];
  const lines: string[] = [];
  let recommendations: Product[] = [];

  const referenced = REFERENCE.test(rest) || BARE_ADD.test(rest) ? resolveReference(rest, lastRecommendations) : [];

  if (CLEAR_INTENT.test(rest)) {
    cartActions.push({ type: 'clear' });
    toolCalls.push({ tool: 'clearCart', input: {}, result: 'Cart cleared' });
    lines.push(cart.length ? 'Done — I’ve cleared your cart.' : 'Your cart is already empty.');
  } else if (REMOVE_INTENT.test(rest)) {
    const targets = mentioned.length ? mentioned : referenced.length ? referenced : cart.length === 1 ? [cart[0]!.product] : [];
    const targetTitles = new Set(targets.map((product) => product.title));
    const removedLines = cart.filter((line) => targetTitles.has(line.product.title));
    removedLines.forEach((line) => {
      cartActions.push({ type: 'remove', productId: line.product.id });
      toolCalls.push({ tool: 'removeFromCart', input: { productId: line.product.id }, result: `${line.product.title} removed` });
    });
    if (removedLines.length) {
      lines.push(`Done — I removed ${listTitles(removedLines.map((line) => line.product.title))} from your cart.`);
    } else if (targets.length) {
      lines.push(`I don’t see ${listTitles(targets.map((product) => product.title))} in your cart, so nothing changed.`);
    } else {
      lines.push('Which item should I remove? Just tell me the name — for example, “remove the Trunner LX”.');
    }
  } else if (ADD_INTENT.test(rest) || BARE_ADD.test(rest)) {
    const targets = mentioned.length ? mentioned : referenced;
    const quantity = extractQuantity(rest);
    targets.forEach((product) => {
      cartActions.push({ type: 'add', product, quantity });
      toolCalls.push({ tool: 'addToCart', input: { productId: product.id, quantity }, result: `${product.title} added to cart` });
    });
    if (targets.length) {
      recommendations = targets;
      const added = targets.map((product) => `${quantity > 1 ? `${quantity}× ` : ''}${product.title} (${formatCurrency(product.price)})`);
      lines.push(`Done — I added ${listTitles(added)} to your cart.`);
    }
  }

  const projectedCart = applyCartActions(cart, cartActions);
  let navigateTo: AssistantPlan['navigateTo'];

  if (CHECKOUT_INTENT.test(rest)) {
    if (projectedCart.length) {
      navigateTo = 'checkout';
      toolCalls.push({ tool: 'goToCheckout', input: { lines: projectedCart.length }, result: 'Redirecting to checkout' });
      lines.push(`${describeCart(projectedCart)} Taking you to checkout now.`);
    } else {
      lines.push('Your cart is empty right now — tell me what you’re after and I’ll find something worth checking out with.');
    }
  } else if (cartActions.length) {
    lines.push(projectedCart.length ? describeCart(projectedCart) : 'Your cart is now empty.');
  }

  if (lines.length) {
    const upsells = findComplementaryProducts([...projectedCart.map((line) => line.product.id), ...recommendations.map((p) => p.id)]);
    if (!navigateTo && cartActions.some((action) => action.type === 'add')) {
      const extra = upsellLine(upsells);
      if (extra) lines.push(extra);
      lines.push('Want to keep browsing, or head to checkout?');
    }
    return { reply: lines.join(' '), recommendations, upsells, toolCalls, cartActions, navigateTo };
  }

  // Discovery flow: compare, single product, search, budget miss, or fallback.
  let budgetMiss = false;
  let noMatch = false;
  const unavailableCategory = findUnavailableCategory(rest);
  const focus =
    mentioned.length < 2 && COMPARE_INTENT.test(rest) && lastRecommendations.length >= 2 ? lastRecommendations : mentioned;
  const isComparison = focus.length >= 2;

  const compareFiller = /^(them|those|these|both|two|side|by|comparison|difference|one|again)$/;
  if (COMPARE_INTENT.test(rest) && focus.length < 2 && tokenize(rest).every((token) => compareFiller.test(token))) {
    return {
      reply: 'Happy to compare — which styles should I put side by side? For example, “compare the Trunner LX and the Session”.',
      recommendations: [],
      upsells: findComplementaryProducts(cartIds),
      toolCalls: [],
    };
  }

  if (focus.length > 0) {
    recommendations = focus.slice(0, 3);
  } else {
    const ranked = dedupeByTitle(searchProducts({ query: rest, category, wantsKids, audience, sort, ...range }));
    recommendations = ranked.slice(0, 2);
    if (recommendations.length === 0 && (range.min !== undefined || range.max !== undefined)) {
      budgetMiss = true;
      const target = range.max ?? range.min ?? 0;
      recommendations = dedupeByTitle(searchProducts({ query: rest, category, wantsKids, audience }))
        .sort((left, right) => Math.abs(left.price - target) - Math.abs(right.price - target))
        .slice(0, 2);
    }
    const tokens = tokenize(rest);
    const hasRelevance = tokens.length > 0 && products.some((product) => relevanceScore(product, tokens) > 0);
    const hasSignal =
      hasRelevance || Boolean(category || audience || sort || wantsKids || unavailableCategory) || range.min !== undefined || range.max !== undefined;
    if (!hasSignal) {
      noMatch = !asksSize;
      recommendations = bestSellers(wantsKids, audience);
    }
  }

  toolCalls.push(searchToolCall(message, category, range, recommendations.length));
  const upsells = findComplementaryProducts([...cartIds, ...recommendations.map((product) => product.id)]);
  toolCalls.push({
    tool: 'recommendProducts',
    input: { category: category ?? recommendations[0]?.category ?? null },
    result: `${upsells.length} complementary items prepared`,
  });

  const rangeText = describeRange(range);
  const [top, second] = recommendations;

  if (asksSize) {
    lines.push('Size-level stock isn’t connected in this demo yet, so I can’t confirm availability for a specific size.');
  }

  if (!top) {
    lines.push('I couldn’t find a match in the current lineup — tell me a style, budget, or who it’s for and I’ll narrow it down.');
  } else if (isComparison) {
    const compared = recommendations;
    const cheapest = [...compared].sort((a, b) => a.price - b.price)[0]!;
    const priciest = [...compared].sort((a, b) => b.price - a.price)[0]!;
    lines.push(compared.map((product) => `${product.title} (${formatCurrency(product.price)}) is ${pitch(product)}`).join('; ') + '.');
    lines.push(
      cheapest.price === priciest.price
        ? 'They sit at the same price point, so it really comes down to the look you prefer.'
        : `${cheapest.title} saves you ${formatCurrency(priciest.price - cheapest.price)} versus ${priciest.title}.`,
    );
  } else if (focus.length === 1) {
    lines.push(`${top.title} is ${formatCurrency(top.price)} — ${pitch(top)}.`);
  } else if (noMatch) {
    lines.push(
      `I couldn’t find anything specific to that in the current Jordan lineup, so here are two best sellers to start from: ${listTitles(recommendations.map((product) => `${product.title} (${formatCurrency(product.price)})`))}.`,
      'Tell me a budget, a style, or who they’re for and I’ll narrow it down.',
    );
  } else if (unavailableCategory) {
    lines.push(
      `We don’t carry ${unavailableCategory} in this collection yet, but if you’re building a look, ${top.title} (${formatCurrency(top.price)}) is a strong anchor piece.`,
    );
  } else if (budgetMiss) {
    lines.push(
      `Nothing in the current lineup lands ${rangeText}, so here are the closest options — starting with ${top.title} at ${formatCurrency(top.price)}.`,
    );
  } else if (asksSize && !category && !audience && !sort && !rangeText) {
    lines.push(`Meanwhile, two best sellers to start from: ${listTitles(recommendations.map((product) => `${product.title} (${formatCurrency(product.price)})`))}.`);
  } else {
    const qualifiers = [describeAudience(audience, wantsKids), rangeText].filter(Boolean).join(' ');
    const lead =
      sort === 'asc'
        ? `The most affordable pick${qualifiers ? ` ${qualifiers}` : ''} is ${top.title} at ${formatCurrency(top.price)} — ${pitch(top)}.`
        : sort === 'desc'
          ? `At the top of the range${qualifiers ? ` ${qualifiers}` : ''} is ${top.title} at ${formatCurrency(top.price)} — ${pitch(top)}.`
          : `${pickOpener(message)}${qualifiers ? ` ${qualifiers}` : ''} is ${top.title} at ${formatCurrency(top.price)} — ${pitch(top)}.`;
    lines.push(lead);
    if (second) {
      const saving = top.price - second.price;
      lines.push(
        `${second.title} (${formatCurrency(second.price)}) is a solid alternative${saving > 0 ? ` if you’d like to save ${formatCurrency(saving)}` : ''}.`,
      );
    }
  }

  if (top && !isComparison && !noMatch) {
    const extra = upsellLine(upsells);
    if (extra && cart.length) lines.push(extra);
  }

  if (top && !noMatch) {
    lines.push(
      isComparison
        ? 'Want me to add one of them to your cart?'
        : recommendations.length > 1
          ? 'Want me to add one to your cart, or compare them side by side?'
          : 'Want me to add it to your cart?',
    );
  }

  return { reply: lines.join(' '), recommendations, upsells, toolCalls };
};
