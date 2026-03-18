"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Ticket,
  Users,
  ListTree,
  TrendingUp,
  Activity,
  ArrowRight,
  Home,
  ArrowLeft,
  LogOut,
  ClipboardList,
  Shield,
  Loader2,
  RefreshCw,
  Link as LinkIcon,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface AdminStats {
  totalTopics: number;
  totalUsers: number;
  activeUsers: number;
  totalOutlines: number;
  estimatedRevenue: number;
  planBreakdown: Record<string, number>;
  freeUsers: number;
  plusUsers: number;
  proUsers: number;
}

export default function AdminPage() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        // Enable browser caching for 1 minute
        next: { revalidate: 60 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setStats(data.stats);
        } else {
          toast.error("Failed to load stats");
        }
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } catch (error) {
      toast.error("Error loading dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  const quickActions = React.useMemo(() => [
    {
      title: "Upload Syllabus",
      description: "Import NEET subjects and topics via JSON",
      href: "/admin/syllabus",
      icon: ListTree,
      color: "bg-green-500",
    },
    {
      title: "Manage Mock Tests",
      description: "Upload CBT-style practice tests",
      href: "/admin/mock-tests",
      icon: ClipboardList,
      color: "bg-blue-500",
    },
    {
      title: "Manage Outlines",
      description: "Define section structure for AI notes",
      href: "/admin/outlines",
      icon: FileText,
      color: "bg-purple-500",
    },
    {
      title: "View Payments",
      description: "Track revenue and user payments",
      href: "/admin/payments",
      icon: DollarSign,
      color: "bg-emerald-500",
    },
    {
      title: "Manage Plans",
      description: "Update plan pricing, validity, and limits",
      href: "/admin/plans",
      icon: Settings,
      color: "bg-teal-600",
    },
    {
      title: "Create Coupons",
      description: "Set up discount codes",
      href: "/admin/coupons",
      icon: Ticket,
      color: "bg-orange-500",
    },
    {
      title: "View Users",
      description: "Monitor user enrollments",
      href: "/admin/users",
      icon: Users,
      color: "bg-pink-500",
    },
    {
      title: "Manage Admins",
      description: "Grant or revoke admin access",
      href: "/admin/admins",
      icon: Shield,
      color: "bg-purple-600",
    },
    {
      title: "Manage Resources",
      description: "Add reference books, video lectures & official links",
      href: "/admin/resources",
      icon: LinkIcon,
      color: "bg-amber-500",
    },
  ], []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-3">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-lg text-slate-600">
              Manage NEET content and platform operations
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">Loading dashboard stats...</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Topics</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats?.totalTopics || 0}</p>
                <p className="text-xs text-blue-600 mt-1">NEET syllabus</p>
              </div>
              <ListTree className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Users</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats?.activeUsers || 0}</p>
                <p className="text-xs text-green-600 mt-1">Enrolled students</p>
              </div>
              <Users className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Outlines</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{stats?.totalOutlines || 0}</p>
                <p className="text-xs text-purple-600 mt-1">Note structures</p>
              </div>
              <FileText className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Revenue</p>
                <p className="text-3xl font-bold text-orange-900 mt-2">
                  ₹{stats?.estimatedRevenue?.toLocaleString('en-IN') || 0}
                </p>
                <p className="text-xs text-orange-600 mt-1">Estimated earnings</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-600" />
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-blue-300 group">
                  <div className="flex items-start gap-4">
                    <div className={`${action.color} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                      <div className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                        Open
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Getting Started Guide */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Getting Started
        </h2>
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-semibold">
              1
            </div>
            <div>
              <p className="font-semibold">Upload Syllabus</p>
              <p className="text-slate-600">Import NEET subjects and topics via JSON in the Syllabus section</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-semibold">
              2
            </div>
            <div>
              <p className="font-semibold">Configure Plans</p>
              <p className="text-slate-600">Set up and manage all pricing plans (Free, Plus, Pro, NEET packs)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-semibold">
              3
            </div>
            <div>
              <p className="font-semibold">Manage Outlines</p>
              <p className="text-slate-600">Set section structure for AI-generated notes per subject</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-semibold">
              4
            </div>
            <div>
              <p className="font-semibold">Monitor Users</p>
              <p className="text-slate-600">Track user enrollments and platform usage</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}


