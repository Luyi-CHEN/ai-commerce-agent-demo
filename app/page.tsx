import { Hero } from '@/components/home/Hero';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { Navbar } from '@/components/ui/Navbar';
import { products } from '@/data/products';
import { suggestedPrompts } from '@/data/prompts';

const trendingProducts = products
  .filter((product, index) => products.findIndex((item) => item.title === product.title) === index)
  .slice(0, 8);

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Navbar />
      <Hero prompts={suggestedPrompts} />
      <TrendingProducts products={trendingProducts} />
    </main>
  );
}
