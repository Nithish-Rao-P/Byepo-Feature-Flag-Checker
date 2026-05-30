"use client";

import { useState } from "react";
import { useTransitionRouter } from "@/src/hooks/use-transition-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrgSchema } from "@/src/lib/validators";
import { apiFetch, authStore, APIError } from "@/src/lib/api-client";
import { AuthGuard } from "@/src/components/auth-guard";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { z } from "zod";
import { Search, Plus, Trash2, Building, ArrowRight, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type CreateOrgInputs = z.infer<typeof createOrgSchema>;

interface Organization {
  id: string;
  name: string;
  slug: string;
  adminCount: number;
  userCount: number;
  flagCount: number;
  createdAt: string;
}

interface OrgListResponse {
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function DashboardPage() {
  const router = useTransitionRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form setup for Org Creation
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateOrgInputs>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const orgName = watch("name");

  // Auto-generate slug from name if user hasn't explicitly entered a custom one
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("name", value);
    const generatedSlug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setValue("slug", generatedSlug);
  };

  // Queries
  const { data, isLoading, isError } = useQuery<OrgListResponse>({
    queryKey: ["organizations", page, searchTerm],
    queryFn: () =>
      apiFetch<OrgListResponse>(
        `/organizations?page=${page}&limit=5&search=${encodeURIComponent(searchTerm)}`
      ),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newOrg: CreateOrgInputs) =>
      apiFetch<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify(newOrg),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      reset();
      setShowAddForm(false);
      setFormError(null);
    },
    onError: (error: unknown) => {
      if (error instanceof APIError) {
        setFormError(error.message);
      } else {
        setFormError("Failed to create organization");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orgId: string) =>
      apiFetch<void>(`/organizations/${orgId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const handleLogout = () => {
    router.replace("/login", () => {
      authStore.clearToken();
    });
  };

  const handleCreateOrg = (data: CreateOrgInputs) => {
    setFormError(null);
    createMutation.mutate(data);
  };

  const handleDeleteOrg = (orgId: string, orgName: string) => {
    if (confirm(`CAUTION: Deleting "${orgName}" will permanently remove all associated users, admins, and feature flags. Proceed?`)) {
      deleteMutation.mutate(orgId);
    }
  };

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <div className="min-h-screen flex flex-col bg-bg-paper relative">
        {/* Editorial Masthead */}
        <header className="border-b-4 border-ink-black py-6 px-6 bg-bg-paper select-none">
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* Stark Geometric Logo (Flag-Check representation) */}
              <div className="border-2 border-ink-black p-2 bg-bg-paper flex-shrink-0 flex items-center justify-center h-14 w-14 select-none">
                <img
                  src="/logo.svg"
                  alt="Flag-Check Logo"
                  className="h-10 w-10"
                />
              </div>
              <div className="text-center sm:text-left">
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase font-bold text-ink-black block mb-1">
                  SUPER ADMIN PORTAL
                </span>
                <h1 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-tight block">
                  ORGANIZATIONS
                </h1>
                <span className="font-mono text-[9px] uppercase tracking-widest text-ink-black block mt-0.5">
                  Platform Management Panel
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-ink-black pt-4 md:pt-0 md:pl-6">
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider block">
                  SUPER ADMIN
                </span>
                <span className="font-body text-xs text-ink-black block">
                  superadmin@flagcheck.com
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="border border-ink-black h-10 w-10 flex items-center justify-center hover:bg-editorial-red hover:text-bg-paper hover:border-editorial-red transition-all cursor-pointer"
                title="Log Out"
                style={{ borderRadius: "0px" }}
              >
                <LogOut className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Layout (Asymmetric Splits) */}
        <main className="flex-1 max-w-screen-xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 border-b border-ink-black gap-8">
          
          {/* Left Area (8 columns) - Organizations Directory */}
          <section className="lg:col-span-8 flex flex-col gap-6 lg:border-r lg:border-ink-black lg:pr-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-ink-black pb-4 gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold uppercase tracking-tight block">
                  ORGANIZATIONS DIRECTORY
                </h2>
                <span className="font-mono text-[10px] text-ink-black uppercase tracking-widest">
                  View and manage registered organizations
                </span>
              </div>

              {/* Stark Search Input */}
              <div className="relative flex items-center w-full sm:max-w-[280px]">
                <Search className="absolute left-3 h-4 w-4 text-ink-black stroke-[1.5]" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border-b-2 border-ink-black bg-transparent pl-9 pr-3 py-1.5 font-mono text-xs focus-visible:bg-[#F0F0F0] focus-visible:outline-none transition-colors duration-150 uppercase placeholder:text-neutral-400"
                  style={{ borderRadius: "0px" }}
                />
              </div>
            </div>

            {/* Organizations Grid */}
            <div className="flex-1 flex flex-col">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center py-20">
                  <span className="font-mono text-xs uppercase tracking-widest animate-pulse">
                    Loading organizations...
                  </span>
                </div>
              ) : isError ? (
                <div className="border border-editorial-red bg-editorial-red/5 p-4 text-center my-8">
                  <span className="font-mono text-xs uppercase tracking-wider text-editorial-red font-bold block mb-1">
                    ⚠ DATABASE FAILURE
                  </span>
                  <p className="font-body text-sm text-ink-black">
                    Failed to fetch the organizations directory.
                  </p>
                </div>
              ) : data?.organizations.length === 0 ? (
                <div className="border border-ink-black p-8 text-center my-8 bg-bg-paper relative">
                  <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-5 [background-size:16px_16px] absolute inset-0 pointer-events-none" />
                  <Building className="h-10 w-10 mx-auto text-ink-black stroke-[1] mb-3" />
                  <h3 className="font-serif text-lg font-bold uppercase block mb-1">
                    No organizations found
                  </h3>
                  <p className="font-body text-xs text-ink-black max-w-sm mx-auto mb-6 leading-relaxed">
                    No active organizations are currently registered.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAddForm(true)}
                    className="hard-shadow-hover"
                  >
                    Create Organization
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <AnimatePresence mode="popLayout">
                    {data?.organizations.map((org, index) => (
                      <motion.div
                        key={org.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15, delay: index * 0.05 }}
                        className="border border-ink-black bg-bg-paper p-6 relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[#F3F3F0] transition-colors duration-150 group"
                      >
                        {/* Dot Halftone Grid Decoration inside cards */}
                        <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:12px_12px] absolute inset-0 pointer-events-none" />
                        
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[9px] border border-ink-black px-1.5 py-0.5 font-bold uppercase tracking-wider select-none bg-neutral-100">
                              ID: {org.id.slice(0, 8)}
                            </span>
                            <span className="font-mono text-[9px] text-ink-black uppercase select-none">
                              {new Date(org.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <h3 className="font-serif text-xl font-bold uppercase tracking-tight block text-ink-black">
                            {org.name}
                          </h3>
                          
                          {/* Metadata Columns */}
                          <div className="flex items-center gap-6 mt-2 font-mono text-[10px] text-ink-black uppercase border-t border-dashed border-neutral-300 pt-2">
                            <div>
                              ADMINS: <span className="font-bold text-ink-black">{org.adminCount}</span>
                            </div>
                            <div>
                              USERS: <span className="font-bold text-ink-black">{org.userCount}</span>
                            </div>
                            <div>
                              FLAGS: <span className="font-bold text-ink-black">{org.flagCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-stretch sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 border-dashed border-neutral-300 pt-4 sm:pt-0">
                          <Button
                            variant="secondary"
                            onClick={() => router.push(`/organizations/${org.id}`)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 group-hover:bg-ink-black group-hover:text-bg-paper transition-all"
                          >
                            View Details <ArrowRight className="h-3 w-3 stroke-[2]" />
                          </Button>
                          
                          <button
                            onClick={() => handleDeleteOrg(org.id, org.name)}
                            className="text-black hover:text-editorial-red font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 px-3 py-1 cursor-pointer select-none group-hover:text-ink-black hover:group-hover:text-editorial-red"
                          >
                            <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Editorial Pagination */}
                  {data && data.pagination.totalPages > 1 && (
                    <div className="border border-ink-black p-4 flex items-center justify-between bg-bg-paper select-none">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold tracking-wider hover:text-editorial-red disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4 stroke-[2]" /> PREVIOUS
                      </button>
                      <span className="font-mono text-xs uppercase tracking-widest">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={page === data.pagination.totalPages}
                        className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold tracking-wider hover:text-editorial-red disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      >
                        NEXT <ChevronRight className="h-4 w-4 stroke-[2]" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Right Area (4 columns) - Action / Dashboard Statistics */}
          <aside className="lg:col-span-4 flex flex-col gap-8">
            {/* New Org Section */}
            <div className="border border-ink-black bg-bg-paper p-6 relative">
              {/* Radial dots overlay */}
              <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:12px_12px] absolute inset-0 pointer-events-none" />
              
              <div className="border-b border-ink-black pb-4 mb-6">
                <h2 className="font-serif text-xl font-bold uppercase tracking-tight block">
                  CREATE ORGANIZATION
                </h2>
                <span className="font-mono text-[9px] text-ink-black font-bold uppercase tracking-widest">
                  Add a new tenant organization
                </span>
              </div>

              {!showAddForm ? (
                <div className="py-4 text-center">
                  <p className="font-body text-xs text-ink-black mb-6 leading-relaxed">
                    Click below to register a brand new organization.
                  </p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 hard-shadow-hover"
                  >
                    <Plus className="h-4 w-4 stroke-[2]" /> Create Organization
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(handleCreateOrg)} className="flex flex-col gap-6">
                  {formError && (
                    <div className="border border-editorial-red bg-editorial-red/5 p-3 text-left">
                      <span className="font-mono text-xs uppercase tracking-wider text-editorial-red font-bold block mb-0.5">
                        ⚠ CREATION ERROR
                      </span>
                      <p className="font-body text-xs text-ink-black leading-normal">
                        {formError}
                      </p>
                    </div>
                  )}

                  <Input
                    label="Organization Name"
                    placeholder="E.g. Stark Industries"
                    disabled={createMutation.isPending}
                    error={errors.name?.message}
                    onChange={handleNameChange}
                    value={orgName || ""}
                  />

                  <Input
                    label="Organization Slug (Auto)"
                    placeholder="e.g. stark-industries"
                    disabled={createMutation.isPending}
                    error={errors.slug?.message}
                    {...register("slug")}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      isLoading={createMutation.isPending}
                      className="flex-1 hard-shadow-hover"
                    >
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={createMutation.isPending}
                      onClick={() => {
                        setShowAddForm(false);
                        reset();
                        setFormError(null);
                      }}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Reference Guidelines */}
            <div className="border-4 border-ink-black bg-bg-paper p-6 relative">
              <div className="border-b border-ink-black pb-3 mb-4 select-none">
                <span className="font-mono text-[9px] tracking-widest uppercase font-bold text-ink-black block mb-0.5">
                  QUICK REFERENCE
                </span>
                <h3 className="font-serif text-lg font-black uppercase tracking-tight block">
                  ORGANIZATION INFO
                </h3>
              </div>
              <ul className="font-body text-xs text-ink-black list-disc list-outside pl-4 flex flex-col gap-3 leading-relaxed">
                <li>
                  <strong className="text-ink-black font-sans uppercase text-[10px] tracking-wide block">Tenancy Isolation</strong>
                  Organizations are isolated tenancies. They do not share users or feature flags.
                </li>
                <li>
                  <strong className="text-ink-black font-sans uppercase text-[10px] tracking-wide block">Admin Signups</strong>
                  Once created, admins onboarding via the <span className="font-mono bg-neutral-100 px-1 border border-neutral-300">admin-web</span> can sign up with this specific organization ID to manage flags.
                </li>
                <li>
                  <strong className="text-ink-black font-sans uppercase text-[10px] tracking-wide block">Cascading Deletion</strong>
                  Deleting a tenant completely cleanses all user registry profiles and scoped feature flags from the active schema ledger.
                </li>
              </ul>
              <div className="border-t border-ink-black mt-6 pt-4 text-center font-serif text-[11px] text-ink-black tracking-[0.3em] select-none">
                ❖ ❖ ❖
              </div>
            </div>
          </aside>
        </main>
        
        {/* Editorial Footer */}
        <footer className="border-t border-ink-black py-8 px-6 bg-bg-paper text-center select-none mt-auto">
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink-black">
            © 2026 Byepo Technologies. All rights reserved.
          </p>
        </footer>
      </div>
    </AuthGuard>
  );
}
