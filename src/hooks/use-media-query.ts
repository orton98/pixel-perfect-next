import * as React from "react";

/**
 * Reactive media-query hook.
 * Example: const isMobile = useMediaQuery("(max-width: 768px)")
 */
export function useMediaQuery(query: string) {
  const getMatch = React.useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = React.useState<boolean>(getMatch);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    // Initialize + subscribe
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
