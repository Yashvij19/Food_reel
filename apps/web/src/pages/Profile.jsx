import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Settings, Bookmark, MapPin, ShoppingBag, 
  LogOut, ChevronRight, Loader2, Store
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usersService } from '../services/users.service';
import { useUIStore } from '../store/uiStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { showSuccess } = useUIStore();
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await usersService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showSuccess('Logged out successfully');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const menuItems = [
    {
      icon: Bookmark,
      label: 'Saved Reels',
      sublabel: `${profile?.stats?.savedReels || 0} saved`,
      path: '/profile/saved'
    },
    {
      icon: ShoppingBag,
      label: 'Order History',
      sublabel: `${profile?.stats?.orders || 0} orders`,
      path: '/orders'
    },
    {
      icon: Store,
      label: 'Following',
      sublabel: `${profile?.stats?.followingRestaurants || 0} restaurants`,
      path: '/profile/following'
    },
    {
      icon: MapPin,
      label: 'Saved Addresses',
      path: '/profile/addresses'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/profile/settings'
    }
  ];

  // Add restaurant dashboard for owners
  if (user?.role === 'restaurant_owner') {
    menuItems.unshift({
      icon: Store,
      label: 'Restaurant Dashboard',
      sublabel: 'Manage your restaurant',
      path: '/restaurant/dashboard',
      highlight: true
    });
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-primary-500/20 to-transparent pt-12 pb-8 px-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center overflow-hidden">
            {profile?.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-dark-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.name}</h1>
            <p className="text-dark-400">{profile?.email}</p>
            {user?.role === 'restaurant_owner' && (
              <span className="inline-block mt-1 text-xs bg-primary-500/20 text-primary-500 px-2 py-1 rounded">
                Restaurant Owner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
              item.highlight 
                ? 'bg-primary-500/10 border border-primary-500/30' 
                : 'bg-dark-900 hover:bg-dark-800'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              item.highlight ? 'bg-primary-500/20' : 'bg-dark-800'
            }`}>
              <item.icon size={20} className={item.highlight ? 'text-primary-500' : ''} />
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.label}</p>
              {item.sublabel && (
                <p className="text-sm text-dark-400">{item.sublabel}</p>
              )}
            </div>
            <ChevronRight size={20} className="text-dark-500" />
          </Link>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-dark-900 hover:bg-dark-800 transition-colors mt-6"
        >
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
            <LogOut size={20} className="text-red-500" />
          </div>
          <span className="font-medium text-red-500">Log Out</span>
        </button>
      </div>
    </div>
  );
}