import * as React from "react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  DollarSign,
  Ticket,
  Users,
  ListTree,
  ArrowLeft,
  ClipboardList,
  Shield
} from "lucide-react";

export const metadata = {
  title: "Admin Panel - ThinqRx",
  description: "Admin panel for managing GPAT syllabus, outlines, pricing, coupons, and users",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/mock-tests", label: "Mock Tests", icon: ClipboardList },
    { href: "/admin/syllabus", label: "Syllabus", icon: ListTree },
    { href: "/admin/outlines", label: "Outlines", icon: FileText },
    { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/admins", label: "Manage Admins", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen gradient-sky-vertical">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sky-200 glass-morphism shadow-xl">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-sky-300 p-6 bg-gradient-to-r from-sky-500 to-sky-600 shadow-lg">
            <Link href="/dashboard" className="text-2xl font-bold text-white">
              ThinqRx
            </Link>
            <p className="mt-1 text-sm text-sky-100">Admin Panel</p>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-sky-50 hover:text-sky-900 group"
                >
                  <Icon className="h-5 w-5 text-slate-500 group-hover:text-sky-600 transition-colors" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sky-200 p-4 bg-sky-50/50">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
