import { useState, useCallback } from "react";

export function useApi<T, Args extends any[]>(apiFunc: (...args: Args) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (...args: Args): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFunc(...args);
        setData(response);
        return response;
      } catch (err: any) {
        const errorMsg = err.message || "An unexpected error occurred";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return { data, loading, error, request, setData };
}

export default useApi;
