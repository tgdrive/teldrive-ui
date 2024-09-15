import { createLazyFileRoute } from "@tanstack/react-router";

import { DriveFileBrowser } from "@/components/FileBrowser";

export const Route = createLazyFileRoute("/_authenticated/$")({
  component: DriveFileBrowser,
});
