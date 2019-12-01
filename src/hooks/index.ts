import { useRef, useState, useEffect } from 'react';

// https://gist.github.com/mudge/eb9178a4b6d595ffde8f9cb31744afcf
const useDebounce = (callback, delay: number) => {
  const latestCallback = useRef();
  const [callCount, setCallCount] = useState<number>(0);

  useEffect((): void => {
    latestCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (callCount > 0) {
      const fire = () => {
        setCallCount(0);
        latestCallback.current();
      };

      const id = setTimeout(fire, delay);
      return () => clearTimeout(id);
    }
  }, [callCount, delay]);

  return () => setCallCount((cc: number): number => cc + 1);
};

export {
  useDebounce,
};
