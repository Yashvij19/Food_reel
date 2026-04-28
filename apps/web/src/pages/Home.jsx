import { Link } from 'react-router-dom';
import { Play, Utensils, ShoppingBag, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: Play,
      title: 'Watch Food Reels',
      description: 'Discover delicious dishes through short, engaging videos'
    },
    {
      icon: Utensils,
      title: 'Find Restaurants',
      description: 'Explore local restaurants and their best dishes'
    },
    {
      icon: ShoppingBag,
      title: 'Order Instantly',
      description: 'See something you like? Order it with just a tap'
    },
    {
      icon: TrendingUp,
      title: 'Personalized Feed',
      description: 'The more you watch, the better recommendations you get'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/20 via-dark-950 to-dark-950" />
        
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-primary-500">Food</span>Reels
          </h1>
          <p className="text-xl md:text-2xl text-dark-300 mb-8">
            Discover, Watch, and Order — All in One Swipe
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/feed"
              className="btn-primary px-8 py-4 text-lg flex items-center gap-2"
            >
              <Play size={24} />
              Start Watching
            </Link>
            
            {!isAuthenticated && (
              <Link
                to="/register"
                className="btn-outline px-8 py-4 text-lg"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-dark-400 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-dark-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card text-center hover:border-primary-500/50 transition-colors"
              >
                <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={28} className="text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-dark-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 bg-gradient-to-t from-primary-500/10 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Explore?
          </h2>
          <p className="text-dark-300 mb-8">
            Join thousands of food lovers discovering their next favorite meal through short videos.
          </p>
          <Link
            to="/feed"
            className="btn-primary px-8 py-4 text-lg inline-flex items-center gap-2"
          >
            <Play size={24} />
            Explore Food Reels
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-dark-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xl font-bold">
            <span className="text-primary-500">Food</span>Reels
          </div>
          <p className="text-dark-500 text-sm">
            © 2024 FoodReels. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}