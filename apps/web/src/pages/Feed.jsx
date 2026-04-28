import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import FeedScroller from '../components/FeedScroller/FeedScroller';
import CartDrawer from '../components/CartDrawer/CartDrawer';
import QRPayment from '../components/QRPayment/QRPayment';
import { useCartStore } from '../store/cartStore';
import { ShoppingBag } from 'lucide-react';

export default function Feed() {
  const { setShowNavbar, cartDrawerOpen, openCartDrawer } = useUIStore();
  const cartItems = useCartStore((state) => state.items);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Hide navbar on feed
  useEffect(() => {
    setShowNavbar(false);
    return () => setShowNavbar(true);
  }, []);

  return (
    <div className="h-screen bg-black">
      <FeedScroller />

      {/* Floating cart button */}
      {itemCount > 0 && (
        <button
          onClick={openCartDrawer}
          className="fixed bottom-6 right-6 bg-primary-500 text-white p-4 rounded-full shadow-lg z-40 animate-scale-in"
        >
          <ShoppingBag size={24} />
          <span className="absolute -top-1 -right-1 bg-white text-primary-500 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {itemCount}
          </span>
        </button>
      )}

      {/* Cart drawer */}
      {cartDrawerOpen && <CartDrawer />}

      {/* QR Payment modal */}
      <QRPayment />
    </div>
  );
}