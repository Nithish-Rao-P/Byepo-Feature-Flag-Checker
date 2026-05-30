"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useTransitionRouter } from "@/src/hooks/use-transition-router";
import { apiFetch } from "@/src/lib/api-client";
import { AuthGuard } from "@/src/components/auth-guard";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, User, Users, Flag, Calendar, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface OrgAdmin {
  id: string;
  name: string;
  email: string;
}

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  admins: OrgAdmin[];
  flagCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrgDetailPage() {
  const router = useTransitionRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const orgId = params.id as string;

  // Queries
  const { data: org, isLoading, isError } = useQuery<OrgDetail>({
    queryKey: ["organization", orgId],
    queryFn: () => apiFetch<OrgDetail>(`/organizations/${orgId}`),
    enabled: !!orgId,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (orgId: string) =>
      apiFetch<void>(`/organizations/${orgId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.replace("/dashboard");
    },
  });

  const handleDeleteOrg = () => {
    if (org && confirm(`CAUTION: Deleting "${org.name}" will permanently remove all associated users, admins, and feature flags. Proceed?`)) {
      deleteMutation.mutate(orgId);
    }
  };

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <div className="min-h-screen flex flex-col bg-bg-paper relative">
        {/* Editorial Subheader Navigation */}
        <div className="border-b border-ink-black py-4 px-6 bg-bg-paper select-none">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 font-mono text-xs uppercase font-bold tracking-wider hover:text-editorial-red transition-colors group cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 stroke-[2] group-hover:-translate-x-0.5 transition-transform" /> 
              Back to Dashboard
            </button>
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink-black">
              Organization Details — ID: {orgId.slice(0, 18)}...
            </span>
          </div>
        </div>

        {/* Dynamic Data Content */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-40">
            <span className="font-mono text-xs uppercase tracking-widest animate-pulse">
              Loading organization profile...
            </span>
          </div>
        ) : isError ? (
          <div className="flex-1 max-w-md mx-auto flex flex-col justify-center items-center py-20 p-6">
            <div className="border border-editorial-red bg-editorial-red/5 p-6 text-center w-full">
              <span className="font-mono text-xs uppercase tracking-wider text-editorial-red font-bold block mb-1">
                ⚠ PROFILE NOT FOUND
              </span>
              <p className="font-body text-sm text-ink-black mb-6 leading-relaxed">
                The requested organization details could not be found or retrieved from the database.
              </p>
              <Button
                variant="secondary"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : org ? (
          <div className="flex-1 max-w-screen-xl w-full mx-auto p-6 flex flex-col gap-8">
            
            {/* Header Identity banner */}
            <div className="border-b-4 border-ink-black pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative select-none">
              {/* Halftone radial dots */}
              <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:16px_16px] absolute inset-0 pointer-events-none" />
              
              <div className="relative">
                <span className="font-mono text-[10px] tracking-[0.2em] border border-ink-black px-2 py-0.5 uppercase font-bold text-ink-black bg-neutral-100 mb-2 inline-block">
                  SLUG: {org.slug}
                </span>
                <h1 className="font-serif text-3xl lg:text-5xl font-black uppercase tracking-tight block">
                  {org.name}
                </h1>
                <div className="flex items-center gap-2 mt-2 font-mono text-[10px] text-ink-black uppercase">
                  <Calendar className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>Created on {new Date(org.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
              </div>

              <button
                onClick={handleDeleteOrg}
                disabled={deleteMutation.isPending}
                className="border border-editorial-red bg-transparent text-editorial-red hover:bg-editorial-red hover:text-bg-paper px-6 py-2.5 font-mono text-xs uppercase tracking-widest font-bold transition-all active:translate-y-[1px] disabled:opacity-50 select-none cursor-pointer flex items-center justify-center gap-2 h-11"
                style={{ borderRadius: "0px" }}
              >
                <Trash2 className="h-4 w-4 stroke-[1.5]" />
                Delete Organization
              </button>
            </div>

            {/* Layout Grid (Asymmetric Split 8 columns / 4 columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-ink-black pb-8">
              
              {/* Left Panel: Associated Administrators (8 Columns) */}
              <section className="lg:col-span-8 flex flex-col gap-6 lg:border-r lg:border-ink-black lg:pr-8">
                <div>
                  <h2 className="font-serif text-xl font-bold uppercase tracking-tight block">
                    Organization Administrators
                  </h2>
                  <span className="font-mono text-[9px] text-ink-black uppercase tracking-widest block mt-0.5">
                    Admins registered under this organization
                  </span>
                </div>

                <div className="border border-ink-black bg-bg-paper relative overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-ink-black bg-neutral-100 uppercase tracking-wider select-none text-[10px]">
                        <th className="py-3 px-4 border-r border-ink-black font-bold">Name</th>
                        <th className="py-3 px-4 border-r border-ink-black font-bold">Email</th>
                        <th className="py-3 px-4 font-bold">User ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {org.admins.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 px-4 text-center font-body text-xs text-ink-black italic">
                            No administrators have signed up for this organization.
                          </td>
                        </tr>
                      ) : (
                        org.admins.map((admin) => (
                          <tr key={admin.id} className="border-b border-neutral-300 last:border-0 hover:bg-[#F3F3F0] transition-colors">
                            <td className="py-3 px-4 border-r border-ink-black font-sans font-bold flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-ink-black stroke-[1.5]" />
                              {admin.name}
                            </td>
                            <td className="py-3 px-4 border-r border-ink-black font-mono">
                              {admin.email}
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-ink-black">
                              {admin.id}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Right Panel: Aggregate Metrics (4 Columns) */}
              <aside className="lg:col-span-4 flex flex-col gap-6">
                <div>
                  <h2 className="font-serif text-xl font-bold uppercase tracking-tight block">
                    Organization Metrics
                  </h2>
                  <span className="font-mono text-[9px] text-ink-black uppercase tracking-widest block mt-0.5">
                    Statistics summary
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Metric Card 1: Users */}
                  <div className="border border-ink-black bg-bg-paper p-6 relative flex items-center justify-between">
                    {/* Halftone radial dots */}
                    <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:12px_12px] absolute inset-0 pointer-events-none" />
                    
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-ink-black uppercase tracking-wider block">
                        Total Users
                      </span>
                      <span className="font-serif text-3xl font-black text-ink-black block">
                        {org.userCount}
                      </span>
                    </div>
                    <div className="border border-ink-black h-12 w-12 flex items-center justify-center bg-neutral-100">
                      <Users className="h-6 w-6 stroke-[1.5] text-ink-black" />
                    </div>
                  </div>

                  {/* Metric Card 2: Flags */}
                  <div className="border border-ink-black bg-bg-paper p-6 relative flex items-center justify-between">
                    {/* Halftone radial dots */}
                    <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:12px_12px] absolute inset-0 pointer-events-none" />
                    
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] text-ink-black uppercase tracking-wider block">
                        Feature Flags
                      </span>
                      <span className="font-serif text-3xl font-black text-ink-black block">
                        {org.flagCount}
                      </span>
                    </div>
                    <div className="border border-ink-black h-12 w-12 flex items-center justify-center bg-neutral-100">
                      <Flag className="h-6 w-6 stroke-[1.5] text-ink-black" />
                    </div>
                  </div>
                </div>

                {/* Sub-profile reference codes */}
                <div className="border border-ink-black bg-bg-paper p-6 relative select-none">
                  <div className="bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.01] [background-size:10px_10px] absolute inset-0 pointer-events-none" />
                  
                  <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-ink-black block mb-3 border-b border-ink-black pb-2">
                    Metadata
                  </span>
                  
                  <div className="flex flex-col gap-3 font-mono text-[9px] text-ink-black uppercase">
                    <div>
                      Organization ID:<br />
                      <span className="font-bold text-ink-black">{org.id}</span>
                    </div>
                    <div>
                      Last Updated:<br />
                      <span className="font-bold text-ink-black">
                        {new Date(org.updatedAt).toLocaleString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })} - {new Date(org.updatedAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>
                </div>

              </aside>

            </div>
          </div>
        ) : null}

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
