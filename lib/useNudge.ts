import { RefObject, useEffect, useState } from 'react';

export function useNudge<T extends HTMLElement>(
  ref: RefObject<T>,
  delay = 5000
) {
  const [shouldNudge, setShouldNudge] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeout: ReturnType<typeof setTimeout>;
    let inView = false;

    const reset = () => {
      clearTimeout(timeout);
      setShouldNudge(false);
      if (inView) {
        timeout = setTimeout(() => setShouldNudge(true), delay);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      reset();
    });

    observer.observe(el);

    const handleActivity = () => reset();
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('touchmove', handleActivity);

    reset();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
      clearTimeout(timeout);
    };
  }, [ref, delay]);

  return shouldNudge;
}

export default useNudge;
