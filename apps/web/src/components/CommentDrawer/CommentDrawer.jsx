import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Trash2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { reelsService } from '../../services/reels.service';

export default function CommentDrawer() {
  const { activeReelId, closeCommentDrawer, showSuccess, showError } = useUIStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const inputRef = useRef(null);
  const commentsContainerRef = useRef(null);

  // Load comments
  useEffect(() => {
    if (!activeReelId) return;

    const loadComments = async () => {
      setIsLoading(true);
      try {
        const { comments: data, meta } = await reelsService.getComments(activeReelId, { page: 1 });
        setComments(data);
        setHasMore(meta.page < meta.totalPages);
        setPage(1);
      } catch (error) {
        showError('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [activeReelId]);

  const loadMore = async () => {
    if (!hasMore || isLoading) return;

    try {
      const nextPage = page + 1;
      const { comments: data, meta } = await reelsService.getComments(activeReelId, { page: nextPage });
      setComments([...comments, ...data]);
      setHasMore(meta.page < meta.totalPages);
      setPage(nextPage);
    } catch (error) {
      showError('Failed to load more comments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await reelsService.createComment(activeReelId, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
      showSuccess('Comment posted!');
    } catch (error) {
      showError('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await reelsService.deleteComment(activeReelId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      showSuccess('Comment deleted');
    } catch (error) {
      showError('Failed to delete comment');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="modal-backdrop"
        onClick={closeCommentDrawer}
      />

      {/* Drawer */}
      <div className="drawer max-h-[70vh] animate-slide-up">
        <div className="drawer-handle" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
          <h3 className="font-semibold">Comments</h3>
          <button 
            onClick={closeCommentDrawer}
            className="p-1 hover:bg-dark-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comments list */}
        <div 
          ref={commentsContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[45vh]"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (scrollHeight - scrollTop - clientHeight < 100) {
              loadMore();
            }
          }}
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-dark-400">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.user.avatarUrl || '/placeholder-avatar.png'}
                  alt={comment.user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user.name}</span>
                    <span className="text-xs text-dark-500">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-dark-200 mt-1">{comment.text}</p>
                </div>
                {user?.id === comment.user.id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-1 text-dark-500 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {isAuthenticated ? (
          <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-4 border-t border-dark-800"
          >
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 bg-dark-800 border border-dark-700 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="p-2 bg-primary-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        ) : (
          <div className="p-4 border-t border-dark-800 text-center">
            <p className="text-dark-400 text-sm">
              <a href="/login" className="text-primary-500 hover:underline">Log in</a>
              {' '}to comment
            </p>
          </div>
        )}
      </div>
    </>
  );
}