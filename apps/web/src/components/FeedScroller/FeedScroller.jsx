import { useEffect, useRef, useCallback } from 'react';
import { useFeedStore } from '../../store/feedStore';
import { useUIStore } from '../../store/uiStore';
import ReelPlayer from '../ReelPlayer/ReelPlayer';
import ReelCard from '../ReelCard/ReelCard';
import CommentDrawer from '../CommentDrawer/CommentDrawer';
import { Loader2 } from 'lucide-react';

export default function FeedScroller() {
  const containerRef = useRef(null);
  const {
    reels,
    currentIndex,
    hasMore,
    isLoading,
    loadFeed,
    setCurrentIndex,
    markWatched
  } = useFeedStore();
  
  const { openCommentDrawer, commentDrawerOpen } = useUIStore();

  // Load initial feed
  useEffect(() => {
    if (reels.length === 0) {
      loadFeed(true);
    }
  }, []);

  // Setup intersection observer for active reel detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.dataset.index, 10);
            setCurrentIndex(index);

            // Load more when near the end
            if (index >= reels.length - 3 && hasMore && !isLoading) {
              loadFeed();
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5
      }
    );

    // Observe all reel elements
    const reelElements = container.querySelectorAll('.snap-item');
    reelElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels.length, hasMore, isLoading]);

  const handleWatchTime = useCallback((reelId) => (watchMs) => {
    markWatched(reelId, watchMs);
  }, [markWatched]);

  const handleCommentClick = useCallback((reelId) => {
    openCommentDrawer(reelId);
  }, [openCommentDrawer]);

  if (reels.length === 0 && isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-dark-400">Loading delicious content...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center p-8">
          <p className="text-xl font-semibold mb-2">No reels yet</p>
          <p className="text-dark-400">Check back soon for tasty content!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={containerRef}
        className="snap-container hide-scrollbar"
      >
        {reels.map((reel, index) => (
          <div 
            key={reel.id}
            data-index={index}
            className="snap-item relative"
          >
            <ReelPlayer
              videoUrl={reel.videoUrl}
              thumbnailUrl={reel.thumbnailUrl}
              isActive={index === currentIndex}
              onWatchTime={handleWatchTime(reel.id)}
            />
            <ReelCard 
              reel={reel}
              onCommentClick={handleCommentClick}
            />
          </div>
        ))}

        {/* Loading indicator at bottom */}
        {isLoading && (
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        )}
      </div>

      {/* Comment drawer */}
      {commentDrawerOpen && <CommentDrawer />}
    </>
  );
}