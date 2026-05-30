"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStore } from "@/src/lib/api-client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = authStore.getToken();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-paper">
      <div className="text-center font-mono text-xs tracking-widest uppercase">
        <span className="inline-block animate-pulse">
          📰 LOADING PLATFORM DESK...
        </span>
      </div>
    </div>
  );
}
