'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductDetailModal } from '@/components/product/ProductDetailModal';
import { useCartStore } from '@/store/cart-store';

interface TrendingProductsProps {
  products: Product[];
}

export function TrendingProducts({ products }: TrendingProductsProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const subtitle = useMemo(
    () => 'Trending items blend premium styling, practical use cases, and clean add-on opportunities for a realistic commerce demo.',
    [],
  );

  return (
    <>
      <div className="mt-12">
        <ProductGrid
          title="Trending products"
          subtitle={subtitle}
          products={products}
          onAddToCart={(product) => addItem(product, 1)}
          onOpenDetail={setSelectedProduct}
        />
      </div>
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={(product) => addItem(product, 1)} />
    </>
  );
}
