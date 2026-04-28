import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, Play, Loader2 } from 'lucide-react';
import { usersService } from '../services/users.service';

export default function SavedReels() {
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async (pageNum = 1) => {
    try {
      const { reels: data, meta } = await usersService.getSavedReels({ page: pageNum });
      if (pageNum === 1) {
        setReels(data);
      } else {
        setReels([...reels, ...data]);
      }
      setHasMore(meta.page < meta.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load saved reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-dark-950/95 backdrop-blur-lg border-b border-dark-800 z-10">
        <div className="flex items-center gap-4 p-4">
          <Link to="/profile" className="p-2 hover:bg-dark-800 rounded-full">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold">Saved Reels</h1>
        </div>
      </div>

      {/* Reels grid */}
      <div className="p-4">
        {reels.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark size={48} className="mx-auto text-dark-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved reels</h3>
            <p className="text-dark-400 mb-4">Reels you save will appear here</p>
            <Link to="/feed" className="btn-primary">
              Browse Reels
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {reels.map((reel) => (
                <Link
                  key={reel.id}
                  to={`/reel/${reel.id}`}
                  className="aspect-[9/16] rounded-lg overflow-hidden relative group"
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
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={32} className="text-white" />
                  </div>

                  {/* Restaurant name */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs truncate">{reel.restaurant.name}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() => loadReels(page + 1)}
                className="w-full mt-4 py-3 text-primary-500 hover:bg-dark-900 rounded-lg"
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}