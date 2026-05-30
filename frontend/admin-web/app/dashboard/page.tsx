"use client";

import { useState, useEffect, useRef } from "react";
import { useTransitionRouter } from "@/src/hooks/use-transition-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, authStore, APIError } from "@/src/lib/api-client";
import { AuthGuard } from "@/src/components/auth-guard";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { jwtDecode } from "jwt-decode";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { flagFormSchema } from "@/src/lib/validators";
import { z } from "zod";
import { gsap } from "gsap";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  X
} from "lucide-react";

interface Flag {
  id: string;
  key: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

interface FlagListResponse {
  flags: Flag[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DecodedToken {
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationName?: string;
}

type FlagFormInputs = z.infer<typeof flagFormSchema>;

export default function DashboardPage() {
  const router = useTransitionRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  
  const [adminEmail, setAdminEmail] = useState("admin@tenant.com");
  const [orgName, setOrgName] = useState("TENANT COMMAND CONSOLE");

  // Modal control states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // GSAP animation references
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Zod form resolver hook
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FlagFormInputs>({
    resolver: zodResolver(flagFormSchema),
    defaultValues: {
      key: "",
      description: "",
      isEnabled: false
    }
  });

  const isEnabled = watch("isEnabled");

  // Decode admin metadata on mount
  useEffect(() => {
    const token = authStore.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setTimeout(() => {
          setAdminEmail(decoded.email);
          setOrgName(decoded.organizationName || "TENANT COMMAND CONSOLE");
        }, 0);
      } catch (err) {
        console.error("Failed to decode session claim:", err);
      }
    }
  }, []);

  // Keyboard Escape listener to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  // Query: Get scoped flags
  const { data, isLoading, isError } = useQuery<FlagListResponse>({
    queryKey: ["flags", page, searchTerm],
    queryFn: () =>
      apiFetch<FlagListResponse>(
        `/flags?page=${page}&limit=8&search=${encodeURIComponent(searchTerm)}`
      )
  });

  // Mutation: Toggle flag
  const toggleMutation = useMutation({
    mutationFn: (flagId: string) =>
      apiFetch<void>(`/flags/${flagId}/toggle`, {
        method: "PATCH"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
    }
  });

  // Mutation: Delete flag
  const deleteMutation = useMutation({
    mutationFn: (flagId: string) =>
      apiFetch<void>(`/flags/${flagId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
    }
  });

  // Mutation: Create flag
  const createMutation = useMutation({
    mutationFn: (newFlag: FlagFormInputs) =>
      apiFetch<void>("/flags", {
        method: "POST",
        body: JSON.stringify(newFlag)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      closeModal();
    },
    onError: (error: unknown) => {
      if (error instanceof APIError) {
        setFormError(error.message);
      } else {
        setFormError("Failed to register feature flag");
      }
    }
  });

  // Mutation: Update flag details
  const editMutation = useMutation({
    mutationFn: (updatedFields: FlagFormInputs) => {
      if (!selectedFlagId) throw new Error("No flag selected");
      return apiFetch<void>(`/flags/${selectedFlagId}`, {
        method: "PATCH",
        body: JSON.stringify({
          description: updatedFields.description,
          isEnabled: updatedFields.isEnabled
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      if (selectedFlagId) {
        queryClient.invalidateQueries({ queryKey: ["flag", selectedFlagId] });
      }
      closeModal();
    },
    onError: (error: unknown) => {
      if (error instanceof APIError) {
        setFormError(error.message);
      } else {
        setFormError("Failed to update feature flag properties");
      }
    }
  });

  const handleLogout = () => {
    router.replace("/login", () => {
      authStore.clearToken();
    });
  };

  const handleToggle = (flagId: string) => {
    toggleMutation.mutate(flagId);
  };

  const handleDeleteFlag = (flagId: string, flagKey: string) => {
    if (
      confirm(
        `CAUTION: Deleting flag "${flagKey}" is permanent. Any application referencing this key will default to disabled (false). Proceed?`
      )
    ) {
      deleteMutation.mutate(flagId);
    }
  };

  // GSAP Animated Drawer opening handler
  const openModal = (mode: "create" | "edit", flag?: Flag) => {
    setFormError(null);
    setModalMode(mode);

    if (mode === "create") {
      setSelectedFlagId(null);
      reset({
        key: "",
        description: "",
        isEnabled: false
      });
    } else if (flag) {
      setSelectedFlagId(flag.id);
      reset({
        key: flag.key,
        description: flag.description || "",
        isEnabled: flag.isEnabled
      });
    }

    setModalOpen(true);

    // Run custom GSAP slide reveal
    setTimeout(() => {
      if (overlayRef.current && drawerRef.current) {
        gsap.killTweensOf([overlayRef.current, drawerRef.current]);
        
        // Backdrop fade in
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        );

        // Side drawer panel slide in
        gsap.fromTo(
          drawerRef.current,
          { x: "100%" },
          { x: "0%", duration: 0.45, ease: "power3.out" }
        );
      }
    }, 0);
  };

  // GSAP Animated Drawer closing handler
  const closeModal = () => {
    if (overlayRef.current && drawerRef.current) {
      gsap.killTweensOf([overlayRef.current, drawerRef.current]);

      // Backdrop fade out
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in"
      });

      // Side drawer slide out
      gsap.to(drawerRef.current, {
        x: "100%",
        duration: 0.35,
        ease: "power3.in",
        onComplete: () => {
          setModalOpen(false);
          setSelectedFlagId(null);
        }
      });
    } else {
      setModalOpen(false);
      setSelectedFlagId(null);
    }
  };

  const onSubmit = (data: FlagFormInputs) => {
    setFormError(null);
    if (modalMode === "create") {
      createMutation.mutate(data);
    } else {
      editMutation.mutate(data);
    }
  };

  // Helper stats
  const totalFlags = data?.pagination.total || 0;
  const activeFlags = data?.flags.filter((f) => f.isEnabled).length || 0;

  return (
    <AuthGuard allowedRoles={["org_admin"]}>
      <div className="min-h-screen flex flex-col bg-bg-paper relative">
        
        {/* Masthead */}
        <header className="border-b-4 border-ink-black py-6 px-6 bg-bg-paper select-none">
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="border-2 border-ink-black p-2 bg-bg-paper flex-shrink-0 flex items-center justify-center h-14 w-14 select-none">
                <img
                  src="/logo.svg"
                  alt="Flag-Check Logo"
                  className="h-10 w-10"
                />
              </div>
              <div className="text-center sm:text-left">
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase font-bold text-ink-black block mb-1">
                  TENANT CONTROL DESK
                </span>
                <h1 className="font-serif text-4xl lg:text-5xl font-black uppercase tracking-tight block max-w-lg truncate text-ink-black">
                  {orgName}
                </h1>
                <span className="font-mono text-[9px] uppercase tracking-widest text-black font-bold block mt-0.5">
                  Feature Flag Command Console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-ink-black pt-4 md:pt-0 md:pl-6">
              <div className="text-right">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider block text-ink-black">
                  ORG ADMIN
                </span>
                <span className="font-body text-xs text-ink-black block max-w-[200px] truncate">
                  {adminEmail}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="border border-ink-black h-10 w-10 flex items-center justify-center hover:bg-editorial-red hover:text-bg-paper hover:border-editorial-red transition-all cursor-pointer text-ink-black"
                title="Log Out"
              >
                <LogOut className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>

          </div>
        </header>

        {/* Dashboard Grid split: 9 cols list, 3 cols sidebar */}
        <main className="flex-1 max-w-screen-xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 border-b border-ink-black gap-8">
          
          {/* Main Directory Table Area (9 columns) */}
          <section className="lg:col-span-9 flex flex-col gap-6 lg:border-r lg:border-ink-black lg:pr-8">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-ink-black pb-4 gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold uppercase tracking-tight block text-ink-black">
                  LEDGER DIRECTORY
                </h2>
                <span className="font-mono text-[10px] text-ink-black uppercase tracking-widest block mt-0.5">
                  Control active organizational feature flags
                </span>
              </div>

              {/* Monospace Search Input */}
              <div className="relative flex items-center w-full sm:max-w-[280px]">
                <Search className="absolute left-3 h-4 w-4 text-ink-black stroke-[1.5]" />
                <input
                  type="text"
                  placeholder="Search flags..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border-b-2 border-ink-black bg-transparent pl-9 pr-3 py-1.5 font-mono text-xs focus-visible:bg-[#F0F0F0] focus-visible:outline-none transition-colors duration-150 uppercase placeholder:text-neutral-400 text-ink-black"
                />
              </div>
            </div>

            {/* Monospace Monocrome Table */}
            <div className="flex-1 flex flex-col">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center py-20">
                  <span className="font-mono text-xs uppercase tracking-widest animate-pulse text-ink-black">
                    Loading ledger directory...
                  </span>
                </div>
              ) : isError ? (
                <div className="border border-editorial-red bg-editorial-red/5 p-4 text-center my-8">
                  <span className="font-mono text-xs uppercase tracking-wider text-editorial-red font-bold block mb-1">
                    ⚠ DATABASE FAILURE
                  </span>
                  <p className="font-body text-xs text-ink-black">
                    Failed to fetch features list from tenant partition.
                  </p>
                </div>
              ) : data?.flags.length === 0 ? (
                <div className="border border-ink-black p-8 text-center my-8 bg-bg-paper relative">
                  <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-5 [background-size:16px_16px] absolute inset-0 pointer-events-none" />
                  <span className="font-mono text-4xl block text-ink-black mb-3 select-none">[∅]</span>
                  <h3 className="font-serif text-lg font-bold uppercase block mb-1 text-ink-black">
                    No flags registered
                  </h3>
                  <p className="font-body text-xs text-ink-black max-w-sm mx-auto mb-6 leading-relaxed">
                    No active feature toggles are currently created in this tenant domain.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => openModal("create")}
                    className="hard-shadow-hover"
                  >
                    Add Feature Flag
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  
                  <div className="border border-ink-black bg-bg-paper relative overflow-x-auto select-none">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-ink-black bg-neutral-100 uppercase tracking-wider select-none text-[10px]">
                          <th className="py-3 px-4 border-r border-ink-black font-bold text-ink-black">Key</th>
                          <th className="py-3 px-4 border-r border-ink-black font-bold max-w-[200px] text-ink-black">Description</th>
                          <th className="py-3 px-4 border-r border-ink-black font-bold text-center text-ink-black">Status</th>
                          <th className="py-3 px-4 border-r border-ink-black font-bold text-ink-black">Author</th>
                          <th className="py-3 px-4 font-bold text-center text-ink-black">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.flags.map((flag) => (
                          <tr
                            key={flag.id}
                            className="border-b border-neutral-300 last:border-0 hover:bg-[#F3F3F0] transition-colors"
                          >
                            {/* Key */}
                            <td className="py-3 px-4 border-r border-ink-black font-bold uppercase text-ink-black">
                              {flag.key}
                            </td>
                            
                            {/* Description */}
                            <td className="py-3 px-4 border-r border-ink-black text-ink-black max-w-[200px] truncate leading-normal">
                              {flag.description || <span className="italic opacity-50">No description provided</span>}
                            </td>

                            {/* Status Checkbox (Brutalist toggle) */}
                            <td className="py-3 px-4 border-r border-ink-black text-center align-middle">
                              <button
                                disabled={toggleMutation.isPending}
                                onClick={() => handleToggle(flag.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-ink-black font-bold uppercase text-[9px] tracking-wider transition-all select-none hover:bg-neutral-100 active:translate-y-[1px] cursor-pointer disabled:opacity-50"
                              >
                                {flag.isEnabled ? (
                                  <>
                                    <CheckSquare className="h-3.5 w-3.5 text-ink-black stroke-[2.5]" />
                                    <span className="text-ink-black">ACTIVE</span>
                                  </>
                                ) : (
                                  <>
                                    <Square className="h-3.5 w-3.5 text-ink-black stroke-[2]" />
                                    <span className="text-ink-black opacity-80">INACTIVE</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Author */}
                            <td className="py-3 px-4 border-r border-ink-black font-sans uppercase font-bold text-[10px] tracking-wide text-ink-black">
                              {flag.createdBy?.name || "System"}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-3">
                                <button
                                  onClick={() => openModal("edit", flag)}
                                  className="text-black hover:text-editorial-red font-mono text-[10px] uppercase font-extrabold tracking-widest flex items-center gap-1 cursor-pointer select-none"
                                  title="Edit Flag"
                                >
                                  <Edit2 className="h-3 w-3 stroke-[2]" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFlag(flag.id, flag.key)}
                                  className="text-black hover:text-editorial-red font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 cursor-pointer select-none"
                                  title="Delete Flag"
                                >
                                  <Trash2 className="h-3.5 w-3.5 stroke-[1.5]" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Monospace Editorial Pagination */}
                  {data && data.pagination.totalPages > 1 && (
                    <div className="border border-ink-black p-4 flex items-center justify-between bg-bg-paper select-none">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold tracking-wider hover:text-editorial-red disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-ink-black"
                      >
                        <ChevronLeft className="h-4 w-4 stroke-[2]" /> PREVIOUS
                      </button>
                      <span className="font-mono text-xs uppercase tracking-widest text-ink-black">
                        Page {data.pagination.page} of {data.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={page === data.pagination.totalPages}
                        className="flex items-center gap-1.5 font-mono text-xs uppercase font-bold tracking-wider hover:text-editorial-red disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-ink-black"
                      >
                        NEXT <ChevronRight className="h-4 w-4 stroke-[2]" />
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>

          </section>

          {/* Sidebar Area (3 columns) */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Create Action Card */}
            <div className="border border-ink-black bg-bg-paper p-6 relative">
              <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:12px_12px] absolute inset-0 pointer-events-none" />
              
              <div className="border-b border-ink-black pb-4 mb-4 select-none">
                <h2 className="font-serif text-xl font-bold uppercase tracking-tight block text-ink-black">
                  CREATE FLAG
                </h2>
                <span className="font-mono text-[9px] text-ink-black font-bold uppercase tracking-widest">
                  Add key feature toggle
                </span>
              </div>
              <p className="font-body text-xs text-ink-black mb-6 leading-relaxed">
                Publish a new feature flag scoping it to this tenant domain.
              </p>
              <Button
                onClick={() => openModal("create")}
                className="w-full flex items-center justify-center gap-2 hard-shadow-hover"
              >
                <Plus className="h-4 w-4 stroke-[2]" /> Create Flag
              </Button>
            </div>

            {/* Quick Metrics Statistics Summary Card */}
            <div className="border border-ink-black bg-bg-paper p-6 relative select-none">
              <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:12px_12px] absolute inset-0 pointer-events-none" />
              
              <div className="border-b border-ink-black pb-4 mb-4 select-none">
                <h2 className="font-serif text-xl font-bold uppercase tracking-tight block text-ink-black">
                  LEDGER STATS
                </h2>
                <span className="font-mono text-[9px] text-ink-black font-bold uppercase tracking-widest">
                  Active directory counters
                </span>
              </div>

              <div className="flex flex-col gap-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-dashed border-neutral-300 pb-2">
                  <span className="text-ink-black font-bold uppercase">Total Features:</span>
                  <span className="font-bold text-ink-black">{totalFlags}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-neutral-300 pb-2">
                  <span className="text-ink-black font-bold uppercase">Active Status:</span>
                  <span className="font-bold text-ink-black">{activeFlags}</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-ink-black font-bold uppercase">Inactive Status:</span>
                  <span className="font-bold text-ink-black">{totalFlags - activeFlags}</span>
                </div>
              </div>
            </div>

          </aside>
        </main>

        {/* Footer */}
        <footer className="border-t border-ink-black py-8 px-6 bg-bg-paper text-center select-none mt-auto">
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink-black">
            © 2026 Byepo Technologies. All rights reserved.
          </p>
        </footer>

        {/* ========================================================
            GSAP Slide-Out Side-Drawer Modal overlay
            ======================================================== */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex justify-end select-none">
            {/* Backdrop */}
            <div
              ref={overlayRef}
              onClick={closeModal}
              className="absolute inset-0 bg-black/35 cursor-pointer backdrop-blur-[1px]"
              style={{ opacity: 0 }}
            />

            {/* Panel */}
            <div
              ref={drawerRef}
              className="relative w-full max-w-md h-full bg-bg-paper border-l-4 border-ink-black shadow-2xl p-8 flex flex-col overflow-y-auto"
              style={{ transform: "translateX(100%)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-ink-black pb-4 mb-6">
                <h3 className="font-serif text-2xl font-black uppercase tracking-tight text-ink-black">
                  {modalMode === "create" ? "Create Feature Flag" : "Edit Feature Flag"}
                </h3>
                <button
                  onClick={closeModal}
                  className="border border-ink-black h-8 w-8 flex items-center justify-center hover:bg-neutral-100 active:translate-y-[1px] transition-colors cursor-pointer text-ink-black"
                >
                  <X className="h-4 w-4 stroke-[2]" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-6">
                {formError && (
                  <div className="border border-editorial-red bg-editorial-red/5 p-3 text-left">
                    <span className="font-mono text-xs uppercase tracking-wider text-editorial-red font-bold block mb-0.5">
                      ⚠ {modalMode === "create" ? "REGISTRATION" : "UPDATE"} FAILURE
                    </span>
                    <p className="font-body text-xs text-ink-black leading-normal">
                      {formError}
                    </p>
                  </div>
                )}

                <Input
                  label="Feature Flag Key"
                  placeholder="E.g. NEW_PAYMENT_FLOW"
                  disabled={modalMode === "edit" || createMutation.isPending || editMutation.isPending}
                  error={errors.key?.message}
                  className={modalMode === "edit" ? "opacity-60 cursor-not-allowed select-none border-neutral-300" : ""}
                  {...register("key")}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-widest text-ink-black font-bold select-none">
                    Description / Purpose
                  </label>
                  <textarea
                    placeholder="Describe the feature scope, targeted audience, or release context..."
                    disabled={createMutation.isPending || editMutation.isPending}
                    className="w-full border-b-2 border-ink-black bg-transparent py-2.5 font-mono text-xs focus-visible:bg-[#F0F0F0] focus-visible:outline-none transition-colors duration-150 rounded-none uppercase text-ink-black resize-y min-h-[80px]"
                    {...register("description")}
                  />
                  {errors.description?.message && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-editorial-red font-bold select-none block mt-1">
                      * {errors.description.message}
                    </span>
                  )}
                </div>

                {/* Stark custom toggler for state */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs uppercase tracking-widest text-ink-black font-bold select-none block mb-1">
                    {modalMode === "create" ? "Default Launch State" : "Active Deployment State"}
                  </label>
                  <button
                    type="button"
                    disabled={createMutation.isPending || editMutation.isPending}
                    onClick={() => setValue("isEnabled", !isEnabled)}
                    className="inline-flex items-center self-start gap-2 px-3 py-2 border border-ink-black font-mono text-xs uppercase font-bold tracking-wider bg-transparent hover:bg-neutral-100 active:translate-y-[1px] cursor-pointer select-none"
                  >
                    {isEnabled ? (
                      <>
                        <CheckSquare className="h-4 w-4 text-ink-black stroke-[2.5]" />
                        <span className="text-ink-black">Active (isEnabled = true)</span>
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 text-ink-black stroke-[2]" />
                        <span className="text-ink-black opacity-80">Inactive (isEnabled = false)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-4 pt-6 border-t border-dashed border-neutral-300 mt-auto">
                  <Button
                    type="submit"
                    isLoading={createMutation.isPending || editMutation.isPending}
                    className="flex-1 hard-shadow-hover"
                  >
                    {modalMode === "create" ? "Register Flag" : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={createMutation.isPending || editMutation.isPending}
                    onClick={closeModal}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
