import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Star, Users, Play, 
  ShoppingBag, Plus, Minus, Loader2 
} from 'lucide-react';
import { restaurantsService } from '../services/restaurants.service';
import { useCartStore } from '../store/cartStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

export default function Restaurant() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const { addItem, items: cartItems } = useCartStore();
  const { showSuccess, showInfo } = useUIStore();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadRestaurant();
  }, [id]);

  const loadRestaurant = async () => {
    try {
            const [restaurantData, menuData] = await Promise.all([
        restaurantsService.getById(id),
        restaurantsService.getMenu(id)
      ]);
      setRestaurant(restaurantData);
      setMenu(menuData);
      setIsFollowing(restaurantData.isFollowing);
      
      // Set first category as active
      if (menuData.groupedByCategory) {
        const categories = Object.keys(menuData.groupedByCategory);
        if (categories.length > 0) {
          setActiveCategory(categories[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load restaurant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      showInfo('Please log in to follow restaurants');
      return;
    }

    try {
      const result = await restaurantsService.toggleFollow(id);
      setIsFollowing(result.following);
      showSuccess(result.following ? 'Following!' : 'Unfollowed');
    } catch (error) {
      console.error('Failed to follow:', error);
    }
  };

  const handleAddToCart = (foodItem) => {
    const result = addItem(
      foodItem,
      { id: restaurant.id, name: restaurant.name }
    );

    if (result.cleared) {
      showInfo('Cart cleared - items from a different restaurant');
    }
    showSuccess(`${foodItem.name} added to cart!`);
  };

  const getCartQuantity = (foodItemId) => {
    const item = cartItems.find(i => i.foodItem.id === foodItemId);
    return item?.quantity || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Restaurant not found</h2>
          <Link to="/feed" className="text-primary-500 hover:underline">
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  const categories = menu?.groupedByCategory ? Object.keys(menu.groupedByCategory) : [];

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Cover image */}
      <div className="relative h-48">
        {restaurant.coverUrl ? (
          <img 
            src={restaurant.coverUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-500/30 to-dark-900" />
        )}
        
        {/* Back button */}
        <Link 
          to="/feed"
          className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-sm rounded-full"
        >
          <ArrowLeft size={20} />
        </Link>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent" />
      </div>

      {/* Restaurant info */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          {/* Logo */}
          <div className="w-24 h-24 bg-dark-800 rounded-xl border-4 border-dark-950 overflow-hidden">
            {restaurant.logoUrl ? (
              <img 
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-dark-400">
                {restaurant.name[0]}
              </div>
            )}
          </div>

          {/* Name and follow */}
          <div className="flex-1 pb-2">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <p className="text-dark-400 capitalize">{restaurant.category?.replace('_', ' ')}</p>
          </div>

          <button
            onClick={handleFollow}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isFollowing
                ? 'bg-dark-700 text-white'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <Users size={16} className="text-primary-500" />
            <span>{restaurant.followersCount} followers</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Play size={16} className="text-primary-500" />
            <span>{restaurant.reelsCount} reels</span>
          </div>
        </div>

        {/* Description */}
        {restaurant.description && (
          <p className="text-dark-300 mb-4">{restaurant.description}</p>
        )}

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-dark-400 mb-6">
          <MapPin size={16} className="mt-0.5" />
          <span>{restaurant.address}</span>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4">
        <h2 className="text-xl font-semibold mb-4">Menu</h2>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 -mx-4 px-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Menu items */}
        <div className="space-y-4">
          {menu?.groupedByCategory?.[activeCategory]?.map((item) => {
            const cartQty = getCartQuantity(item.id);

            return (
              <div 
                key={item.id}
                className="bg-dark-900 rounded-xl p-4 flex gap-4"
              >
                {/* Item image */}
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}

                {/* Item details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      item.isVeg ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <h3 className="font-medium">{item.name}</h3>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-dark-400 line-clamp-2 mb-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-primary-500">
                      ${item.price.toFixed(2)}
                    </span>

                    {item.isAvailable ? (
                      cartQty > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => useCartStore.getState().updateQuantity(item.id, cartQty - 1)}
                            className="p-1 bg-dark-700 rounded-md hover:bg-dark-600"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{cartQty}</span>
                          <button
                            onClick={() => useCartStore.getState().updateQuantity(item.id, cartQty + 1)}
                            className="p-1 bg-primary-500 rounded-md hover:bg-primary-600"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 rounded-lg text-sm font-medium hover:bg-primary-600"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      )
                    ) : (
                      <span className="text-sm text-dark-500">Unavailable</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent reels */}
        {restaurant.recentReels?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recent Reels</h2>
            <div className="grid grid-cols-3 gap-2">
              {restaurant.recentReels.map((reel) => (
                <Link
                  key={reel.id}
                  to={`/reel/${reel.id}`}
                  className="aspect-[9/16] rounded-lg overflow-hidden relative"
                >
                  {reel.thumbnailUrl ? (
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.caption}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-800 flex items-center justify-center">
                      <Play size={24} className="text-dark-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play size={32} className="text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}