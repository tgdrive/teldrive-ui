import type { BrowseView, FileListParams } from "@/types";
import { createFileRoute } from "@tanstack/react-router";

import { fileQueries } from "@/utils/query-options";
import { ErrorView } from "@/components/error-view";

const allowedTypes = ["my-drive", "recent", "search", "storage", "browse"];

export const Route = createFileRoute("/_authed/$view")({
  beforeLoad: ({ params }) => {
    if (!allowedTypes.includes(params.view)) {
      throw new Error("invalid path");
    }
  },
  validateSearch: (search: Record<string, unknown>) => (search || {}) as FileListParams["params"],
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps, params }) => {
    await queryClient.ensureInfiniteQueryData(
      fileQueries.list({ view: params.view as BrowseView, params: deps }),
    );
  },
  wrapInSuspense: true,
  errorComponent: ({ error }) => {
    return <ErrorView message={error.message} />;
  },
});
