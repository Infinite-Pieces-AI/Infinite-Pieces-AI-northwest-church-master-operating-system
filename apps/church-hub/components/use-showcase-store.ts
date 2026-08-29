"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

export function useShowcaseStore<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void, boolean] {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch {
      window.localStorage.removeItem(key);
    } finally {
      setHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  function reset() {
    window.localStorage.removeItem(key);
    setValue(initialRef.current);
  }

  return [value, setValue, reset, hydrated];
}
