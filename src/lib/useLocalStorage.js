import { useEffect, useState } from 'react';

/** useState yang otomatis tersimpan di localStorage (aman jika storage diblokir). */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...initialValue, ...JSON.parse(stored) } : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Mode privat / storage penuh: abaikan, aplikasi tetap berjalan.
    }
  }, [key, value]);

  return [value, setValue];
}
