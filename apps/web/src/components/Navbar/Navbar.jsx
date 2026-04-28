import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useUIStore } from '../../store/uiStore';

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const cartStore = useCartStore();
  const { showNavbar } = useUIStore();

  // Hide navbar on certain pages
  const hiddenPaths = ['/feed', '/login', '/register'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path)) && location.pathname === '/feed') {
    return null;
  }

  if (!showNavbar) return null;

  const itemCount = cartStore.items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { icon: Home, label: 'Home', path: '/feed' },
    { icon: Search, label: 'Search', path: '/restaurants' },
    ...(user?.role === 'restaurant_owner'
      ? [{ icon: PlusSquare, label: 'Create', path: '/restaurant/manage' }]
      : []),
    { icon: ShoppingBag, label: 'Orders', path: '/orders', badge: itemCount },
    { icon: User, label: 'Profile', path: isAuthenticated ? '/profile' : '/login' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-950/95 backdrop-blur-lg border-t border-dark-800 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const isActive = location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center w-16 h-full relative transition-colors ${
                isActive ? 'text-primary-500' : 'text-dark-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}