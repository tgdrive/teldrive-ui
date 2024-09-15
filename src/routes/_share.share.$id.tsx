import type { ShareQuery, ShareQueryParams } from "@/types";
import { createFileRoute } from "@tanstack/react-router";
import { shareQueries } from "@/utils/queryOptions";
import { AxiosError } from "feaxios";
import { ErrorView } from "@/components/ErrorView";

export const Route = createFileRoute("/_share/share/$id")({
  validateSearch: (search: Record<string, unknown>) => search as ShareQuery,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, params, preload, deps }) => {
    await queryClient.fetchQuery(shareQueries.share(params.id));
    const password = JSON.parse(sessionStorage.getItem("password") || "null");
    const queryParams = {
      id: params.id,
      password: password || "",
      path: deps.path || "",
    } as ShareQueryParams;

    if (preload) {
      await queryClient.prefetchInfiniteQuery(shareQueries.list(queryParams));
    } else {
      queryClient.fetchInfiniteQuery(shareQueries.list(queryParams));
    }
  },
  wrapInSuspense: true,
  errorComponent: ({ error }) => {
    let errorMessage = "server error";
    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || errorMessage;
    } else {
      errorMessage = error.message || errorMessage;
    }
    return <ErrorView message={errorMessage} />;
  },
});
