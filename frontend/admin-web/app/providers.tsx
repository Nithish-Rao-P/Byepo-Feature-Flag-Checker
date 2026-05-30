"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TransitionProvider } from "@/src/components/transition-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 1000, // 10 seconds cache validity
            refetchOnWindowFocus: false, // Prevent focus auto-refetching
            retry: 1, // Single retry on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TransitionProvider>
        {children}
      </TransitionProvider>
    </QueryClientProvider>
  );
}
