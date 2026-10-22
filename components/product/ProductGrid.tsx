import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';

interface ProductGridProps {
  title: string;
  subtitle: string;
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
  chatInline?: boolean;
}

export function ProductGrid({ title, subtitle, products, onAddToCart, onOpenDetail, chatInline = false }: ProductGridProps) {
  const gridClassName = chatInline ? 'grid grid-cols-1 gap-2.5 sm:grid-cols-2' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3';
  const visibleProducts = chatInline ? products.slice(0, 2) : products;

  return (
    <section className={chatInline ? 'space-y-2.5' : 'space-y-5'}>
      <div className={`flex flex-col gap-2 ${chatInline ? '' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
        <div>
          <p className={`font-semibold uppercase tracking-[0.22em] text-slate-500 ${chatInline ? 'text-[11px]' : 'text-sm'}`}>Curated picks</p>
          <h2 className={chatInline ? 'text-sm font-semibold tracking-tight text-slate-950' : 'text-2xl font-semibold tracking-tight text-slate-950'}>{title}</h2>
        </div>
        {!chatInline ? <p className="max-w-xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
      </div>

      <div className={gridClassName}>
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            chatInline={chatInline}
            onAddToCart={onAddToCart}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </section>
  );
}
