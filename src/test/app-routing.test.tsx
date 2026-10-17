import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId, isRedirect } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it.each(['/series', '/animation'])("redirects retired category %s to Movies", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const route = router.matchRoutes(path).at(-1)?.routeId;
    expect(route).toBe(path);
    const beforeLoad = route ? router.routesById[route]?.options.beforeLoad : undefined;
    expect(beforeLoad).toBeTypeOf('function');
    try {
      if (beforeLoad) beforeLoad({} as never);
      throw new Error('Retired category did not redirect');
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      if (isRedirect(error)) expect(error.options.to).toBe('/movies');
    }
  });
});
