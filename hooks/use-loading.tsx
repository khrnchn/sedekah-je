import { useState, useCallback } from "react";

export function useLoading() {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    (asyncFunction: any) => {
      return async (...args: any) => {
        try {
          startLoading();
          return await asyncFunction(...args);
        } finally {
          stopLoading();
        }
      };
    },
    [startLoading, stopLoading],
  );

  return { isLoading, withLoading };
}
