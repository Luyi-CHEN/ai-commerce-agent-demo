import { CheckoutView } from '@/components/cart/CheckoutView';
import { Navbar } from '@/components/ui/Navbar';

export default function CheckoutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Navbar />
      <CheckoutView />
    </main>
  );
}
