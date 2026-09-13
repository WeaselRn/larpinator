"use client";

import { useCallback, useState } from "react";

export function useAnalysis<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const run = useCallback(async (fetcher: () => Promise<Response>) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetcher();
      const data = (await response.json().catch(() => null)) as
        | (T & { error?: string })
        | null;
      if (!response.ok) {
        throw new Error(data?.error ?? `Request failed (${response.status}).`);
      }
      setResult(data as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, run, reset };
}
