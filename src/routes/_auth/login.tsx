import { Login } from "@/components/login";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (search) => search as { redirect?: string },
  component: Login,
});
