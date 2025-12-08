import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): ApiResponse<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await apiFunction(...args);
        
        setState(prev => ({ 
          ...prev, 
          data: result, 
          loading: false 
        }));

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          loading: false 
        }));

        if (options.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback((): void => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}

export function useApiMutation<T = any, V = any>(
  apiFunction: (variables: V) => Promise<T>
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (variables: V) => Promise<T | null>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await apiFunction(variables);
        
        setState(prev => ({ 
          ...prev, 
          data: result, 
          loading: false 
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          loading: false 
        }));

        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback((): void => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    mutate,
    reset,
  };
}

export function useApiQuery<T = any>(
  queryKey: string,
  apiFunction: () => Promise<T>,
  options: UseApiOptions & { enabled?: boolean } = {}
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<T | null>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const refetch = useCallback(
    async (): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await apiFunction();
        
        setState(prev => ({ 
          ...prev, 
          data: result, 
          loading: false 
        }));

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          loading: false 
        }));

        if (options.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback((): void => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Auto-fetch on mount if immediate is true and enabled is true
  useState(() => {
    if (options.immediate !== false && options.enabled !== false) {
      refetch();
    }
  });

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    reset,
  };
}