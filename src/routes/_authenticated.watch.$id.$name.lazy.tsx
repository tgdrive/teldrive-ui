import { createLazyFileRoute } from "@tanstack/react-router";

import { VideoSoloPreview } from "@/components/previews/video/VideoSoloPreview";

export const Route = createLazyFileRoute("/_authenticated/watch/$id/$name")({
  component: VideoSoloPreview,
});
