import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, MessageCircle, Bookmark, Share2, 
  ShoppingBag, UserPlus, UserCheck 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useUIStore } from '../../store/uiStore';
import { useFeedStore } from '../../store/feedStore';
import { reelsService } from '../../services/reels.service';
import { restaurantsService } from '../../services/restaurants.service';

export default function ReelCard({ reel, onCommentClick }) {
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { showSuccess, showError, showInfo } = useUIStore();
  const { updateReelLike, updateReelSave, updateReelFollow } = useFeedStore();

  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) {
      showInfo('Please log in to like reels');
      return;
    }

    if (isLiking) return;
    setIsLiking(true);
    setLikeAnimation(true);

    try {
      const result = await reelsService.toggleLike(reel.id);
      updateReelLike(reel.id, result.liked, result.likesCount);
    } catch (error) {
      showError('Failed to like reel');
    } finally {
      setIsLiking(false);
      setTimeout(() => setLikeAnimation(false), 400);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      showInfo('Please log in to save reels');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const result = await reelsService.toggleSave(reel.id);
      updateReelSave(reel.id, result.saved);
      showSuccess(result.saved ? 'Reel saved!' : 'Reel unsaved');
    } catch (error) {
      showError('Failed to save reel');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      showInfo('Please log in to follow restaurants');
      return;
    }

    if (isFollowing) return;
    setIsFollowing(true);

    try {
      const result = await restaurantsService.toggleFollow(reel.restaurant.id);
      updateReelFollow(reel.restaurant.id, result.following);
      showSuccess(
        result.following 
          ? `Following ${reel.restaurant.name}!` 
          : `Unfollowed ${reel.restaurant.name}`
      );
    } catch (error) {
      showError('Failed to follow restaurant');
    } finally {
      setIsFollowing(false);
    }
  };

  const handleAddToCart = () => {
    if (!reel.foodItem) return;

    const result = addItem(
      reel.foodItem,
      { id: reel.restaurant.id, name: reel.restaurant.name },
      reel.id
    );

    if (result.cleared) {
      showInfo('Cart cleared - items from a different restaurant');
    }
    showSuccess(`${reel.foodItem.name} added to cart!`);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: reel.caption || 'Check out this food reel!',
        url: `${window.location.origin}/reel/${reel.id}`
      });
    } catch (error) {
      // Fallback to copy link
      navigator.clipboard.writeText(`${window.location.origin}/reel/${reel.id}`);
      showSuccess('Link copied to clipboard!');
    }
  };

  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 gradient-overlay-top pointer-events-auto">
        {/* Header could go here */}
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 pointer-events-auto">
        {/* Like */}
        <button 
          onClick={handleLike}
          className="flex flex-col items-center"
          disabled={isLiking}
        >
          <div className={`p-2 ${likeAnimation ? 'like-animation' : ''}`}>
            <Heart 
              size={28} 
              className={reel.isLiked ? 'text-primary-500 fill-primary-500' : 'text-white'}
            />
          </div>
          <span className="text-xs font-medium">{formatCount(reel.likesCount)}</span>
        </button>

        {/* Comments */}
        <button 
          onClick={() => onCommentClick?.(reel.id)}
          className="flex flex-col items-center"
        >
          <div className="p-2">
            <MessageCircle size={28} />
          </div>
          <span className="text-xs font-medium">{formatCount(reel.commentsCount)}</span>
        </button>

        {/* Save */}
        <button 
          onClick={handleSave}
          className="flex flex-col items-center"
          disabled={isSaving}
        >
          <div className="p-2">
            <Bookmark 
              size={28} 
              className={reel.isSaved ? 'text-yellow-500 fill-yellow-500' : 'text-white'}
            />
          </div>
          <span className="text-xs font-medium">Save</span>
        </button>

        {/* Share */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center"
        >
          <div className="p-2">
            <Share2 size={28} />
          </div>
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 gradient-overlay-bottom pointer-events-auto">
        {/* Restaurant info */}
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/restaurant/${reel.restaurant.id}`}>
            <img 
              src={reel.restaurant.logoUrl || '/placeholder-restaurant.png'}
              alt={reel.restaurant.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          </Link>
          <div className="flex-1">
            <Link 
              to={`/restaurant/${reel.restaurant.id}`}
              className="font-semibold hover:underline"
            >
              {reel.restaurant.name}
            </Link>
            {reel.restaurant.category && (
              <p className="text-xs text-dark-300 capitalize">
                {reel.restaurant.category.replace('_', ' ')}
              </p>
            )}
          </div>
          <button
            onClick={handleFollow}
            disabled={isFollowing}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              reel.restaurant.isFollowing
                ? 'bg-dark-700 text-white'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {reel.restaurant.isFollowing ? (
              <span className="flex items-center gap-1">
                <UserCheck size={14} /> Following
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserPlus size={14} /> Follow
              </span>
            )}
          </button>
        </div>

        {/* Caption */}
        {reel.caption && (
          <p className="text-sm mb-3 line-clamp-2">{reel.caption}</p>
        )}

        {/* Food item & order button */}
        {reel.foodItem && (
          <div className="flex items-center justify-between bg-dark-900/80 backdrop-blur-sm rounded-xl p-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  reel.foodItem.isVeg ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">{reel.foodItem.name}</span>
              </div>
              <p className="text-lg font-bold text-primary-500">
                ${reel.foodItem.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!reel.foodItem.isAvailable}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                reel.foodItem.isAvailable
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag size={18} />
              {reel.foodItem.isAvailable ? 'Add' : 'Unavailable'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}