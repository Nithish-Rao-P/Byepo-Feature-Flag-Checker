"use client";

import { useState, useEffect } from "react";
import { useTransitionRouter } from "@/src/hooks/use-transition-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginFormSchema } from "@/src/lib/validators";
import { apiFetch, authStore, APIError } from "@/src/lib/api-client";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { z } from "zod";

type LoginFormInputs = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useTransitionRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, bypass login
  useEffect(() => {
    if (authStore.getToken()) {
      router.replace("/");
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setServerError(null);
    setIsLoading(true);
    
    try {
      const response = await apiFetch<{ token: string; user: { id: string; email: string; role: string } }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      
      authStore.setToken(response.token);
      router.replace("/");
    } catch (error) {
      if (error instanceof APIError) {
        setServerError(error.message);
      } else {
        setServerError("Failed to establish server connection");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-bg-paper relative newsprint-texture">
      <div className="w-full max-w-[400px] bg-bg-paper border-4 border-ink-black p-8 relative">
        
        {/* Newspaper Style Header */}
        <div className="text-center border-b border-ink-black pb-6 mb-8 select-none flex flex-col items-center gap-3">
          <div className="border border-ink-black p-1.5 bg-bg-paper flex items-center justify-center h-10 w-10 select-none">
            <img
              src="/logo.svg"
              alt="Flag-Check Logo"
              className="h-7 w-7"
            />
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase font-bold block mb-1">
              BYEPO TECHNOLOGIES
            </span>
            <h1 className="font-serif text-3xl font-black uppercase tracking-tight block">
              USER LOGIN
            </h1>
          </div>
          <div className="flex items-center justify-center font-mono text-[10px] text-ink-black uppercase border-t border-ink-black w-full mt-2 pt-2">
            <span>Log in to check feature flags</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {serverError && (
            <div className="border border-editorial-red bg-editorial-red/5 p-3 text-left">
              <span className="font-mono text-xs uppercase tracking-wider text-editorial-red font-bold block mb-0.5">
                ⚠ ACCESS DENIED
              </span>
              <p className="font-body text-xs text-ink-black leading-normal">
                {serverError}
              </p>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="banner@stark.com"
            disabled={isLoading}
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            disabled={isLoading}
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" isLoading={isLoading} className="w-full mt-2 hard-shadow-hover">
            Sign In
          </Button>
        </form>

        {/* Dynamic Nav Switch */}
        <div className="text-center font-mono text-xs uppercase tracking-wide mt-6 select-none">
          Not registered yet?{" "}
          <button
            onClick={() => router.push("/signup")}
            className="font-bold underline text-ink-black hover:text-editorial-red cursor-pointer"
          >
            Create Account
          </button>
        </div>

        {/* Footer Ornaments */}
        <div className="text-center font-serif text-[10px] text-ink-black mt-8 tracking-[0.5em] select-none">
          ✦ ✦ ✦
        </div>
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-ink-black mt-4 select-none">
        © 2026 Byepo Technologies. All rights reserved.
      </div>
    </div>
  );
}
