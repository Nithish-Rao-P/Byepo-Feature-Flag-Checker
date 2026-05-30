"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStore } from "@/src/lib/api-client";
import { jwtDecode } from "jwt-decode";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<"super_admin" | "org_admin" | "end_user">;
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = authStore.getToken();
      const isPublicPath = pathname === "/login" || pathname === "/signup";

      if (!token) {
        if (!isPublicPath) {
          router.replace("/login");
        }
        return;
      }

      try {
        const decoded = jwtDecode<{ role: "super_admin" | "org_admin" | "end_user" }>(token);
        if (!allowedRoles.includes(decoded.role)) {
          // Token matches wrong app portal, boot user
          authStore.clearToken();
          router.replace("/login");
          return;
        }
        
        setAuthorized(true);
      } catch {
        authStore.clearToken();
        router.replace("/login");
      }
    };

    checkAuth();
  }, [router, pathname, allowedRoles]);

  const isPublicPath = pathname === "/login" || pathname === "/signup";

  // If unauthenticated and on a protected route, show newsprint styled loading state
  if (!authorized && !isPublicPath) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F7]">
        <div className="text-center font-mono text-xs tracking-widest uppercase">
          <span className="inline-block animate-pulse">
            📰 VERIFYING PLATFORM EDITION CREDENTIALS...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
