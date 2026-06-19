import { useEffect, useRef } from 'react';

/**
 * Cleans up object URLs when they are replaced, removed, or on unmount.
 * @param {string[]} urls - Object URLs to track.
 */
export function useObjectUrlCleanup(urls) {
  const prevUrlsRef = useRef([]);

  useEffect(() => {
    const prev = prevUrlsRef.current;
    const next = (urls || []).filter(Boolean);

    prev.forEach((url) => {
      if (!next.includes(url)) URL.revokeObjectURL(url);
    });

    prevUrlsRef.current = next;

    return () => {
      prevUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      prevUrlsRef.current = [];
    };
  }, [urls]);
}