import createFetchClient from "openapi-fetch";
import createClient from "./openapi-query";
import type { paths } from "@/lib/api";
import fetch from "./fetch-throw";

export const fetchClient = createFetchClient<paths>({
  baseUrl: "/api",
  requestInitExt: {
    signal: AbortSignal.timeout(180 * 1000),
  },
  fetch,
});

export const $api = createClient(fetchClient);
