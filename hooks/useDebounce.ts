/**
 * hooks/useDebounce.ts
 * Generic debounce hook — 150ms default cho tiếng Việt (dấu = 2-3 keystroke).
 * Tránh fire 20-25 SQLite queries/giây khi gõ nhanh.
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
