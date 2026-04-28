import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { reelsService } from '../services/reels.service';
import ReelPlayer from '../components/ReelPlayer/ReelPlayer';
import ReelCard from '../components/ReelCard/ReelCard';
import CommentDrawer from '../components/CommentDrawer/CommentDrawer';
import { useUIStore } from '../store/uiStore';

export default function ReelDetail() {
  const { id } = useParams();
  const [reel, setReel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { commentDrawerOpen, openCommentDrawer } = useUIStore();

  useEffect(() => {
    loadReel();
  }, [id]);

  const loadReel = async () => {
    try {
      const data = await reelsService.getReelById(id);
      setReel(data);
    } catch (error) {
      console.error('Failed to load reel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchTime = async (watchMs) => {
    try {
      await reelsService.recordView(id, watchMs);
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Reel not found</h2>
          <Link to="/feed" className="text-primary-500 hover:underline">
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black relative">
      {/* Back button */}
      <Link 
        to="/feed"
        className="absolute top-4 left-4 z-20 p-2 bg-black/50 backdrop-blur-sm rounded-full"
      >
        <ArrowLeft size={20} />
      </Link>

      {/* Reel player */}
      <ReelPlayer
        videoUrl={reel.videoUrl}
        thumbnailUrl={reel.thumbnailUrl}
        isActive={true}
        onWatchTime={handleWatchTime}
      />

      {/* Reel overlay */}
      <ReelCard
        reel={reel}
        onCommentClick={() => openCommentDrawer(reel.id)}
      />

      {/* Comment drawer */}
      {commentDrawerOpen && <CommentDrawer />}
    </div>
  );
}