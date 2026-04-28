import { create } from 'zustand';
import { reelsService } from '../services/reels.service';

export const useFeedStore = create((set, get) => ({
  reels: [],
  currentIndex: 0,
  cursor: null,
  hasMore: true,
  isLoading: false,
  error: null,

  // Track watched reels to avoid duplicate view events
  watchedReels: new Set(),

  // Actions
  loadFeed: async (reset = false) => {
    const state = get();
    
    if (state.isLoading) return;
    if (!reset && !state.hasMore) return;

    set({ isLoading: true, error: null });

    try {
      const params = reset ? {} : { cursor: state.cursor };
      const { reels, meta } = await reelsService.getFeed(params);

      set({
        reels: reset ? reels : [...state.reels, ...reels],
        cursor: meta.nextCursor,
        hasMore: meta.hasMore,
        isLoading: false,
        currentIndex: reset ? 0 : state.currentIndex
      });
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to load feed',
        isLoading: false
      });
    }
  },

  setCurrentIndex: (index) => {
    set({ currentIndex: index });
  },

  markWatched: async (reelId, watchMs) => {
    const state = get();
    
    // Prevent duplicate view events for same reel in same session
    if (state.watchedReels.has(reelId)) return;

    try {
      await reelsService.recordView(reelId, watchMs);
      set({
        watchedReels: new Set([...state.watchedReels, reelId])
      });
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  },

  updateReelLike: (reelId, liked, likesCount) => {
    const state = get();
    const newReels = state.reels.map((reel) =>
      reel.id === reelId
        ? { ...reel, isLiked: liked, likesCount }
        : reel
    );
    set({ reels: newReels });
  },

  updateReelSave: (reelId, saved) => {
    const state = get();
    const newReels = state.reels.map((reel) =>
      reel.id === reelId
        ? { ...reel, isSaved: saved }
        : reel
    );
    set({ reels: newReels });
  },

  updateReelFollow: (restaurantId, following) => {
    const state = get();
    const newReels = state.reels.map((reel) =>
      reel.restaurant.id === restaurantId
        ? { ...reel, restaurant: { ...reel.restaurant, isFollowing: following } }
        : reel
    );
    set({ reels: newReels });
  },

  resetFeed: () => {
    set({
      reels: [],
      currentIndex: 0,
      cursor: null,
      hasMore: true,
      isLoading: false,
      error: null,
      watchedReels: new Set()
    });
  }
}));