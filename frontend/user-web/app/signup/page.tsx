"use client";

import { useState, useEffect } from "react";
import { useTransitionRouter } from "@/src/hooks/use-transition-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupFormSchema } from "@/src/lib/validators";
import { apiFetch, authStore, APIError } from "@/src/lib/api-client";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { z } from "zod";

type SignupFormInputs = z.infer<typeof signupFormSchema>;

interface Organization {
  id: string;
  name: string;
}

export default function SignupPage() {
  const router = useTransitionRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // If already authenticated, bypass signup
  useEffect(() => {
    if (authStore.getToken()) {
      router.replace("/");
    }
  }, [router]);

  // Fetch registered organizations to feed select dropdown
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await apiFetch<{ organizations: Organization[] }>("/organizations?limit=100");
        setOrganizations(response.organizations || []);
      } catch (err) {
        console.error("Failed to load organizations:", err);
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      organizationId: "",
    },
  });

  const onSubmit = async (data: SignupFormInputs) => {
    setServerError(null);
    setIsLoading(true);
    
    try {
      const response = await apiFetch<{ token: string; user: { id: string; email: string; role: string } }>(
        "/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({
            ...data,
            role: "end_user",
          }),
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
      <div className="w-full max-w-[420px] bg-bg-paper border-4 border-ink-black p-8 relative">
        
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
              USER SIGN UP
            </h1>
          </div>
          <div className="flex items-center justify-center font-mono text-[10px] text-ink-black uppercase border-t border-ink-black w-full mt-2 pt-2">
            <span>Register user evaluation account</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {serverError && (
            <div className="border border-editorial-red bg-editorial-red/5 p-3 text-left">
              <span className="font-mono text-xs uppercase tracking-wider text-editorial-red font-bold block mb-0.5">
                ⚠ REGISTRATION FAILURE
              </span>
              <p className="font-body text-xs text-ink-black leading-normal">
                {serverError}
              </p>
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="E.g. Bruce Banner"
            disabled={isLoading}
            error={errors.name?.message}
            {...register("name")}
          />

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

          {/* Monospace Custom Select wrapper */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[10px] uppercase font-bold tracking-wider text-ink-black select-none">
              Tenant Organization
            </label>
            <div className="relative">
              <select
                disabled={isLoading || loadingOrgs}
                className="w-full border-b-2 border-ink-black bg-transparent py-2.5 font-mono text-xs focus-visible:bg-[#F0F0F0] focus-visible:outline-none transition-colors duration-150 rounded-none appearance-none cursor-pointer uppercase text-ink-black"
                {...register("organizationId")}
              >
                <option value="" disabled className="bg-bg-paper">
                  {loadingOrgs ? "LOADING TENANTS..." : "SELECT YOUR ORGANIZATION"}
                </option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-bg-paper">
                    {org.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none font-mono text-xs select-none uppercase font-bold text-ink-black">
                [↓]
              </div>
            </div>
            {errors.organizationId?.message && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-editorial-red font-bold select-none block mt-1">
                * {errors.organizationId.message}
              </span>
            )}
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full mt-2 hard-shadow-hover">
            Create Account
          </Button>
        </form>

        {/* Dynamic Nav Switch */}
        <div className="text-center font-mono text-xs uppercase tracking-wide mt-6 select-none">
          Already registered?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-bold underline text-ink-black hover:text-editorial-red cursor-pointer"
          >
            Sign In
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
