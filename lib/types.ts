export type ProductCategory = 'shoes' | 'apparel' | 'electronics' | 'accessories' | 'fitness';

export interface Product {
  id: string;
  title: string;
  price: number;
  rating: number;
  category: ProductCategory;
  description: string;
  image: string;
  tags: string[];
  summary: string;
  features: string[];
  useCases: string[];
  upsellIds: string[];
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'thinking' | 'typing' | 'done';
  recommendations?: Product[];
  toolCalls?: ToolCallLog[];
}

export interface ToolCallLog {
  tool: 'searchProducts' | 'recommendProducts' | 'addToCart' | 'removeFromCart' | 'clearCart' | 'goToCheckout';
  input: Record<string, unknown>;
  result: string;
}

export type CartAction =
  | { type: 'add'; product: Product; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'clear' };

export interface AssistantPlan {
  reply: string;
  recommendations: Product[];
  upsells: Product[];
  toolCalls: ToolCallLog[];
  cartActions?: CartAction[];
  navigateTo?: 'checkout';
}
