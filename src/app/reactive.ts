import { watch } from "@vue/reactivity";
import { useEffect, useReducer, useRef } from "react";

/**
 * Subscribe a React component to the shared stores (which use Vue's
 * standalone reactivity, copied unchanged from the original site).
 * Usage: const movies = useV(() => publicMovies.value)
 */
export function useV<T>(getter: () => T): T {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const g = useRef(getter);
  g.current = getter;
  useEffect(() => {
    const h = watch(() => g.current(), () => force(), { deep: true });
    return () => h.stop();
  }, []);
  return getter();
}
