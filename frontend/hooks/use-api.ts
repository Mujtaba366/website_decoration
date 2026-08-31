import { useState, useCallback, useEffect, DependencyList } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  initialData: T | null = null,
  deps: DependencyList = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: initialData === null,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setState({
        data: initialData,
        loading: false,
        error: errorMessage,
      });
    }
  }, [apiCall, initialData]);

  useEffect(() => {
    refetch();
  }, deps);

  return {
    ...state,
    refetch,
  };
}
