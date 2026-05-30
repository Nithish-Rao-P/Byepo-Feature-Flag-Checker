"use client";

import { useState, useEffect, useRef } from "react";
import { useTransitionRouter } from "@/src/hooks/use-transition-router";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, authStore, APIError } from "@/src/lib/api-client";
import { AuthGuard } from "@/src/components/auth-guard";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { jwtDecode } from "jwt-decode";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { gsap } from "gsap";
import { LogOut, CheckCircle2, XCircle, Search, History } from "lucide-react";

interface DecodedToken {
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName?: string;
}

interface FlagCheckResponse {
  success: boolean;
  data: {
    featureKey: string;
    isEnabled: boolean;
    organizationId: string;
    organizationName: string;
  };
}

interface HistoricalCheck {
  key: string;
  isEnabled: boolean;
  timestamp: string;
}

const checkFormSchema = z.object({
  featureKey: z
    .string()
    .min(2, "Feature key must be at least 2 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Key must contain only alphanumeric characters and underscores"
    )
});

type CheckFormInputs = z.infer<typeof checkFormSchema>;

export default function HomePage() {
  const router = useTransitionRouter();
  const [userEmail, setUserEmail] = useState("user@tenant.com");
  const [orgName, setOrgName] = useState("TENANT SPACE");
  const [result, setResult] = useState<FlagCheckResponse["data"] | null>(null);
  const [history, setHistory] = useState<HistoricalCheck[]>([]);

  // GSAP animation references
  const resultCardRef = useRef<HTMLDivElement>(null);

  // React Hook Form resolver
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CheckFormInputs>({
    resolver: zodResolver(checkFormSchema),
    defaultValues: {
      featureKey: ""
    }
  });

  // Fetch token claims and session storage history on mount
  useEffect(() => {
    const token = authStore.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setTimeout(() => {
          setUserEmail(decoded.email);
          setOrgName(decoded.organizationName || "TENANT SPACE");
        }, 0);
      } catch (err) {
        console.error("Failed to decode end user session claims:", err);
      }
    }

    // Load session storage query ledger
    try {
      const storedHistory = sessionStorage.getItem("flag_check_history");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (err) {
      console.error("Failed to load historical check logs:", err);
    }
  }, []);

  // Mutation: Check flag status scoped to org
  const checkMutation = useMutation({
    mutationFn: (payload: CheckFormInputs) =>
      apiFetch<FlagCheckResponse["data"]>("/flags/check", {
        method: "POST",
        body: JSON.stringify({
          featureKey: payload.featureKey.toUpperCase()
        })
      }),
    onSuccess: (response) => {
      const checkedData = response;
      setResult(checkedData);

      // Append check to history (up to last 5 checks)
      const newCheck: HistoricalCheck = {
        key: checkedData.featureKey,
        isEnabled: checkedData.isEnabled,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      };

      setHistory((prev) => {
        // Filter out existing instances of this key to prevent duplicates in history
        const filtered = prev.filter((item) => item.key !== newCheck.key);
        const updated = [newCheck, ...filtered].slice(0, 5);
        try {
          sessionStorage.setItem("flag_check_history", JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to write to session ledger:", err);
        }
        return updated;
      });

      // GSAP Pop reveal animation on response card
      setTimeout(() => {
        if (resultCardRef.current) {
          gsap.killTweensOf(resultCardRef.current);
          gsap.fromTo(
            resultCardRef.current,
            { scale: 0.94, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
          );
        }
      }, 0);
    }
  });

  const onSubmit = (data: CheckFormInputs) => {
    checkMutation.mutate(data);
  };

  const handleLogout = () => {
    router.replace("/login", () => {
      authStore.clearToken();
    });
  };

  const selectHistoryItem = (key: string) => {
    setValue("featureKey", key);
  };

  return (
    <AuthGuard allowedRoles={["end_user"]}>
      <div className="min-h-screen flex flex-col bg-bg-paper relative">
        
        {/* ========================================================
            STOCK-TICKER MOVING CRAWL MARQUEE (Top Alert Bar)
            ======================================================== */}
        <div className="w-full bg-ink-black text-bg-paper font-mono text-[9px] uppercase tracking-[0.2em] py-2 border-b border-ink-black overflow-hidden relative select-none">
          <div className="flex animate-marquee">
            <span className="mx-4">
              SYSTEM SECURITY: OK // EVALUATING SCOPES ACTIVE // ORG: {orgName} // CONNECTED //
            </span>
            <span className="mx-4">
              BYEPO END-USER QUERY CLIENT v1.0.0 // PROTOCOL: BEAVERS // READY //
            </span>
            <span className="mx-4">
              SYSTEM SECURITY: OK // EVALUATING SCOPES ACTIVE // ORG: {orgName} // CONNECTED //
            </span>
            <span className="mx-4">
              BYEPO END-USER QUERY CLIENT v1.0.0 // PROTOCOL: BEAVERS // READY //
            </span>
          </div>
        </div>

        {/* Masthead */}
        <header className="border-b-4 border-ink-black py-5 px-6 bg-bg-paper select-none">
          <div className="max-w-screen-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="border-2 border-ink-black p-1.5 bg-bg-paper flex items-center justify-center h-10 w-10 select-none">
                <img
                  src="/logo.svg"
                  alt="Flag-Check Logo"
                  className="h-7 w-7"
                />
              </div>
              <div className="text-left">
                <span className="font-mono text-[8px] tracking-[0.25em] uppercase font-bold text-ink-black block mb-0.5">
                  BYEPO SERVICES
                </span>
                <h1 className="font-serif text-2xl font-black uppercase tracking-tight block text-ink-black">
                  {orgName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2 sm:pt-0 sm:border-l border-ink-black sm:pl-6">
              <div className="text-right select-none">
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider block text-ink-black">
                  END USER
                </span>
                <span className="font-body text-xs text-ink-black block max-w-[180px] truncate">
                  {userEmail}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="border border-ink-black h-9 w-9 flex items-center justify-center hover:bg-editorial-red hover:text-bg-paper hover:border-editorial-red transition-all cursor-pointer text-ink-black"
                title="Log Out"
              >
                <LogOut className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>

          </div>
        </header>

        {/* Dense central form sheet */}
        <main className="flex-1 max-w-screen-md w-full mx-auto p-6 flex flex-col justify-center select-none py-10 gap-8">
          
          {/* Main Evaluator Block */}
          <div className="border-4 border-ink-black bg-bg-paper p-8 relative">
            <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:16px_16px] absolute inset-0 pointer-events-none" />
            
            <div className="border-b border-ink-black pb-4 mb-6">
              {/* Giant Serif Drop Cap Header */}
              <div className="relative">
                <span className="float-left text-6xl font-serif font-black mr-2 mt-0.5 text-ink-black select-none leading-[0.8] align-top">
                  C
                </span>
                <h2 className="font-serif text-3xl font-black uppercase tracking-tight text-ink-black select-none">
                  HECK STATUS
                </h2>
              </div>
              <span className="font-mono text-[9px] text-ink-black font-bold uppercase tracking-widest block mt-1.5">
                Query feature flag configurations scoped to {orgName}
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              {/* Monospace Bottom-Bordered Input */}
              <div className="relative flex flex-col gap-1 w-full">
                <label className="font-mono text-xs uppercase tracking-widest text-ink-black font-bold select-none">
                  Feature Flag Key
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-ink-black stroke-[1.5]" />
                  <input
                    type="text"
                    placeholder="E.G. BETA_DASHBOARD"
                    disabled={checkMutation.isPending}
                    className={`w-full border-b-2 border-ink-black bg-transparent pl-9 pr-3 py-3 font-mono text-sm focus-visible:bg-[#F0F0F0] focus-visible:outline-none transition-colors duration-150 uppercase placeholder:text-neutral-400 text-ink-black rounded-none ${
                      errors.featureKey ? "border-editorial-red text-editorial-red" : ""
                    }`}
                    {...register("featureKey")}
                  />
                </div>
                {errors.featureKey?.message && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-editorial-red font-bold mt-1">
                    ⚠ {errors.featureKey.message}
                  </span>
                )}
              </div>

              <Button
                type="submit"
                isLoading={checkMutation.isPending}
                className="w-full py-3.5 hard-shadow-hover"
              >
                Evaluate Feature Key
              </Button>
            </form>
          </div>

          {/* ========================================================
              GSAP-ANIMATED RESULT INDICATOR PANEL
              ======================================================== */}
          {result && (
            <div
              ref={resultCardRef}
              className={`border-4 bg-bg-paper p-6 relative flex flex-col items-center text-center justify-center select-none shadow-lg ${
                result.isEnabled
                  ? "border-green-600 shadow-green-600/5 bg-[linear-gradient(to_bottom,rgba(22,163,74,0.05),transparent)]"
                  : "border-ink-black shadow-black/5 bg-[linear-gradient(to_bottom,rgba(17,17,17,0.03),transparent)]"
              }`}
            >
              <span className="font-mono text-[9px] tracking-widest uppercase font-bold text-ink-black block mb-3 border-b border-ink-black pb-1.5 w-full max-w-[200px]">
                Evaluation Result
              </span>

              {result.isEnabled ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="h-10 w-10 text-green-600 stroke-[2] mb-1" />
                  <h3 className="font-serif text-3xl font-black uppercase tracking-wide text-green-700">
                    ENABLED
                  </h3>
                  <p className="font-mono text-[10px] text-ink-black uppercase max-w-sm mt-1">
                    Feature <strong className="font-extrabold">{result.featureKey}</strong> is actively launched on your tenant domain.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="h-10 w-10 text-ink-black stroke-[1.5] mb-1" />
                  <h3 className="font-serif text-3xl font-black uppercase tracking-wide text-ink-black">
                    DISABLED
                  </h3>
                  <p className="font-mono text-[10px] text-ink-black uppercase max-w-sm mt-1">
                    Feature <strong className="font-extrabold">{result.featureKey}</strong> is currently locked or unregistered.
                  </p>
                </div>
              )}

              <div className="border-t border-dashed border-neutral-300 mt-5 pt-3 w-full flex items-center justify-between font-mono text-[9px] text-ink-black uppercase">
                <span>Scope: {result.organizationName}</span>
                <span>ID: {result.organizationId.slice(0, 13)}...</span>
              </div>
            </div>
          )}

          {/* ========================================================
              SESSION CHECKS HISTORY LEDGER
              ======================================================== */}
          {history.length > 0 && (
            <div className="border border-ink-black bg-bg-paper p-6 relative select-none">
              <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.01] [background-size:10px_10px] absolute inset-0 pointer-events-none" />
              
              <div className="flex items-center gap-2 border-b border-ink-black pb-3 mb-4">
                <History className="h-4 w-4 text-ink-black stroke-[1.5]" />
                <h3 className="font-serif text-lg font-bold uppercase tracking-tight text-ink-black">
                  Session Ledger Logs
                </h3>
              </div>

              <div className="flex flex-col gap-2.5">
                {history.map((item, idx) => (
                  <button
                    key={`${item.key}-${idx}`}
                    onClick={() => selectHistoryItem(item.key)}
                    className="flex items-center justify-between font-mono text-[10px] uppercase p-2 border border-dashed border-neutral-300 hover:border-ink-black bg-transparent hover:bg-neutral-50 transition-colors cursor-pointer w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-bold">[{idx + 1}]</span>
                      <span className="font-bold text-ink-black">{item.key}</span>
                      <span className="text-neutral-400 text-[8px]">{item.timestamp}</span>
                    </div>
                    {item.isEnabled ? (
                      <span className="text-green-700 font-bold border border-green-600 px-1 bg-green-50">
                        ENABLED
                      </span>
                    ) : (
                      <span className="text-ink-black font-bold border border-ink-black px-1 bg-neutral-100">
                        DISABLED
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-ink-black py-8 px-6 bg-bg-paper text-center select-none mt-auto">
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink-black">
            © 2026 Byepo Technologies. All rights reserved.
          </p>
        </footer>

      </div>
    </AuthGuard>
  );
}
