"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStore } from "@/src/lib/api-client";

export default function Home() {
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
    <div className="flex h-screen items-center justify-center bg-[#F9F9F7]">
      <div className="text-center font-mono text-xs tracking-widest uppercase select-none animate-pulse">
        📖 Loading Control Room...
      </div>
    </div>
  );
}
