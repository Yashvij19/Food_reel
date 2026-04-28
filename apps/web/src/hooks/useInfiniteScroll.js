import { useEffect, useCallback, useRef } from 'react';

export function useInfiniteScroll(callback, options = {}) {
  const { threshold = 100, enabled = true } = options;
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (!enabled || loadingRef.current) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loadingRef.current = true;
      Promise.resolve(callback()).finally(() => {
        loadingRef.current = false;
      });
    }
  }, [callback, threshold, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll, enabled]);

  // For use with IntersectionObserver as sentinel
  const sentinelRef = useCallback(
    (node) => {
      if (!enabled) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && !loadingRef.current) {
              loadingRef.current = true;
              Promise.resolve(callback()).finally(() => {
                loadingRef.current = false;
              });
            }
          },
          { threshold: 0.1 }
        );

        observerRef.current.observe(node);
      }
    },
    [callback, enabled]
  );

  return { sentinelRef };
}