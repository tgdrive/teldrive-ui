import "./globals.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";

import { queryClient } from "@/utils/query-client";

import { TailwindIndicator } from "./components/tailwind-indicator";
import { ThemeProvider } from "./components/theme-provider";
import { ProgressProvider } from "./components/top-progress";
import { routeTree } from "./route-tree.gen";
import { StrictMode } from "react";

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProgressProvider>
        <ThemeProvider>
          <Toaster
            toastOptions={{
              className: "!bg-surface-container !text-on-surface",
            }}
            position="bottom-right"
          />
          <RouterProvider router={router} />
        </ThemeProvider>
        <TailwindIndicator />
      </ProgressProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
     </StrictMode>
  );
}
