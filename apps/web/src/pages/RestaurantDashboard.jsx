import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, TrendingUp, Eye, Heart, ShoppingBag, 
  Users, Clock, DollarSign, Loader2, Play, BarChart3
} from 'lucide-react';
import { restaurantsService } from '../services/restaurants.service';
import { analyticsService } from '../services/analytics.service';
import { useUIStore } from '../store/uiStore';

export default function RestaurantDashboard() {
  const { showError } = useUIStore();
  
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadAnalytics();
    }
  }, [selectedRestaurant, period]);

  const loadRestaurants = async () => {
    try {
      const data = await restaurantsService.getMyRestaurants();
      setRestaurants(data);
      if (data.length > 0) {
        setSelectedRestaurant(data[0]);
      }
    } catch (error) {
      showError('Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await analyticsService.getRestaurantAnalytics(selectedRestaurant.id, period);
      setAnalytics(data);
    } catch (error) {
      showError('Failed to load analytics');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-dark-950 pb-20">
        <div className="p-4">
          <Link to="/profile" className="p-2 hover:bg-dark-800 rounded-full inline-block">
            <ArrowLeft size={20} />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-12">
          <BarChart3 size={64} className="text-dark-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No restaurants yet</h2>
          <p className="text-dark-400 text-center mb-6">
            Create your first restaurant to start tracking analytics
          </p>
          <Link to="/restaurant/manage" className="btn-primary">
            Create Restaurant
          </Link>
        </div>
      </div>
    );
  }

  const statCards = analytics ? [
    { icon: Eye, label: 'Total Views', value: analytics.summary.totalViews.toLocaleString(), color: 'text-blue-500' },
    { icon: Heart, label: 'Total Likes', value: analytics.summary.totalLikes.toLocaleString(), color: 'text-red-500' },
    { icon: ShoppingBag, label: 'Orders', value: analytics.summary.totalOrders.toLocaleString(), color: 'text-green-500' },
    { icon: DollarSign, label: 'Revenue', value: `$${analytics.summary.totalRevenue.toFixed(2)}`, color: 'text-yellow-500' },
    { icon: Users, label: 'Followers', value: analytics.summary.followers.toLocaleString(), color: 'text-purple-500' },
    { icon: TrendingUp, label: 'Conversion', value: `${analytics.summary.conversionRate}%`, color: 'text-primary-500' },
    { icon: Clock, label: 'Avg Watch Time', value: `${analytics.summary.avgWatchTimeSeconds}s`, color: 'text-cyan-500' },
    { icon: Play, label: 'Total Reels', value: analytics.summary.totalReels.toLocaleString(), color: 'text-orange-500' },
  ] : [];

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-dark-950/95 backdrop-blur-lg border-b border-dark-800 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link to="/profile" className="p-2 hover:bg-dark-800 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Restaurant selector */}
        {restaurants.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => setSelectedRestaurant(restaurant)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedRestaurant?.id === restaurant.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {restaurant.name}
              </button>
            ))}
          </div>
        )}

        {/* Period selector */}
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                period === p
                  ? 'bg-dark-700 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        {/* Stats grid */}
        {isLoadingAnalytics ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-dark-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon size={18} className={stat.color} />
                    <span className="text-sm text-dark-400">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Top reels */}
            {analytics.topReels.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Top Performing Reels</h2>
                <div className="space-y-3">
                  {analytics.topReels.map((reel, index) => (
                    <Link
                      key={reel.id}
                      to={`/reel/${reel.id}`}
                      className="flex items-center gap-4 bg-dark-900 rounded-xl p-3"
                    >
                      <span className="text-lg font-bold text-dark-500 w-6">
                        #{index + 1}
                      </span>
                      {reel.thumbnailUrl && (
                        <img
                          src={reel.thumbnailUrl}
                          alt={reel.caption}
                          className="w-12 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{reel.caption || 'No caption'}</p>
                        <div className="flex items-center gap-4 text-xs text-dark-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> {reel.viewsCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={12} /> {reel.likesCount}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/restaurant/manage"
            className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 text-center"
          >
            <Play size={24} className="mx-auto mb-2 text-primary-500" />
            <span className="text-sm font-medium">Upload Reel</span>
          </Link>
          <Link
            to="/restaurant/manage"
            className="bg-dark-800 rounded-xl p-4 text-center"
          >
            <ShoppingBag size={24} className="mx-auto mb-2 text-dark-400" />
            <span className="text-sm font-medium">Manage Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}