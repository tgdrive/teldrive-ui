import type { BrowseView, FilterQuery, QueryParams } from "@/types";
import { createFileRoute } from "@tanstack/react-router";

import { fileQueries } from "@/utils/query-options";
import { AxiosError } from "feaxios";
import { ErrorView } from "@/components/error-view";

const allowedTypes = ["my-drive", "recent", "search", "storage", "browse", "shared"];

export const Route = createFileRoute("/_authed/$view")({
  beforeLoad: ({ params }) => {
    if (!allowedTypes.includes(params.view)) {
      throw new Error("invalid path");
    }
  },
  validateSearch: (search: Record<string, unknown>) => search as FilterQuery,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps, params }) => {
    const queryParams: QueryParams = { view: params.view as BrowseView, search: deps };
    await queryClient.ensureInfiniteQueryData(fileQueries.list(queryParams));
  },
  wrapInSuspense: true,
  errorComponent: ({ error }) => {
    let errorMessage = "server error";
    if (error instanceof AxiosError) {
      errorMessage =
        error.response?.status === 404
          ? "invalid path"
          : error.response?.data?.message || errorMessage;
    } else {
      errorMessage = error.message || errorMessage;
    }
    return <ErrorView message={errorMessage} />;
  },
});
