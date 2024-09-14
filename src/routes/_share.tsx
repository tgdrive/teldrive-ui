import { ShareLayout } from "@/layouts/ShareLayout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_share")({
  component: ShareLayout,
});
