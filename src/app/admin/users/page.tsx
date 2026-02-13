"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Calendar,
  Award,
  BookOpen,
  TrendingUp,
  Ban,
  CheckCircle,
  IndianRupee,
  Target,
  Rocket,
  Sparkles,
  Zap,
  Crown,
  Smartphone
} from "lucide-react";

// Block User Button Component
function BlockUserButton({ userId, userEmail, currentStatus, onStatusChange }: {
  userId: string;
  userEmail: string;
  currentStatus: string;
  onStatusChange: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  
  const handleBlockUnblock = async () => {
    const action = currentStatus === "blocked" ? "unblock" : "block";
    const confirmMessage = action === "block" 
      ? `Are you sure you want to block ${userEmail}? They will not be able to access the platform.`
      : `Are you sure you want to unblock ${userEmail}? They will regain access to the platform.`;
    
    if (!confirm(confirmMessage)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.ok) {
        toast.success(data.message);
        onStatusChange();
      } else {
        toast.error(data.message || `Failed to ${action} user`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleBlockUnblock}
      disabled={loading}
      size="sm"
      variant={currentStatus === "blocked" ? "default" : "destructive"}
      className="gap-2"
    >
      {currentStatus === "blocked" ? (
        <>
          <CheckCircle className="h-3 w-3" />
          Unblock
        </>
      ) : (
        <>
          <Ban className="h-3 w-3" />
          Block
        </>
      )}
    </Button>
  );
}

// Reset Devices Button Component
function ResetDevicesButton({ userId, userEmail }: {
  userId: string;
  userEmail: string;
}) {
  const [loading, setLoading] = React.useState(false);
  
  const handleResetDevices = async () => {
    const confirmMessage = `Are you sure you want to reset all devices for ${userEmail}? They will need to login again on all devices.`;
    
    if (!confirm(confirmMessage)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message || "Devices reset successfully");
      } else {
        toast.error(data.error || "Failed to reset devices");
      }
    } catch (error) {
      toast.error("Failed to reset devices");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleResetDevices}
      disabled={loading}
      size="sm"
      variant="outline"
      className="gap-2"
      title="Reset all registered devices for this user"
    >
      <Smartphone className="h-3 w-3" />
      Reset Devices
    </Button>
  );
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  plan_category: string;
}

interface UserEnrollment {
  userId: string;
  email: string;
  name: string | null;
  courseName: string;
  courseCode: string;
  plan: string;
  status: string;
  userStatus: string; // active, blocked, suspended
  enrolledAt: string;
  validUntil: string | null;
  totalAttempts: number;
  notesGenerated: number;
  paymentAmount: number | null;
  paymentDate: string | null;
}

export default function AdminUsersPage() {
  const [enrollments, setEnrollments] = React.useState<UserEnrollment[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCourse, setSelectedCourse] = React.useState<string>("all");
  const [selectedPlan, setSelectedPlan] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");

  // Load courses
  React.useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        toast.error("Failed to load courses");
      }
    };
    loadCourses();
  }, []);

  // Load plans
  React.useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await fetch("/api/pricing");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch (error) {
        toast.error("Failed to load plans");
      }
    };
    loadPlans();
  }, []);

  // Load enrollments
  const loadEnrollments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      } else {
        toast.error("Failed to load user enrollments");
      }
    } catch (error) {
      toast.error("Failed to load user enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEnrollments();
    
    // Set up realtime subscription for enrollments AND profiles
    const setupRealtimeSubscription = async () => {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createSupabaseBrowserClient();
      
      const channel = supabase
        .channel("admin-users")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "course_enrollments",
          },
          () => {
            loadEnrollments();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
          },
          () => {
            loadEnrollments();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments",
          },
          () => {
            loadEnrollments();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [loadEnrollments]);

  // Filter enrollments
  const filteredEnrollments = React.useMemo(() => {
    return enrollments.filter((enrollment) => {
      const matchesSearch =
        !searchQuery ||
        enrollment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCourse =
        selectedCourse === "all" ||
        enrollment.courseCode === courses.find((c) => c.id === selectedCourse)?.code;

      const matchesPlan =
        selectedPlan === "all" ||
        enrollment.plan.toLowerCase() === selectedPlan.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" ||
        enrollment.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesCourse && matchesPlan && matchesStatus;
    });
  }, [enrollments, searchQuery, selectedCourse, selectedPlan, selectedStatus, courses]);

  // Statistics - dynamically compute based on actual plans
  const stats = React.useMemo(() => {
    const base: { total: number; active: number; [key: string]: number } = {
      total: filteredEnrollments.length,
      active: filteredEnrollments.filter((e) => e.status === "active").length,
    };
    
    // Compute counts for each plan dynamically
    plans.forEach((plan) => {
      base[plan.id] = filteredEnrollments.filter((e) => e.plan === plan.id).length;
    });
    
    return base;
  }, [filteredEnrollments, plans]);

  const getPlanIcon = (planId: string) => {
    const icons: Record<string, any> = {
      'free': Sparkles,
      'plus': Zap,
      'pro': Crown,
      'gpat_last_minute': Target,
      'gpat_2027_full': Rocket,
    };
    return icons[planId] || Award;
  };

  const getPlanCardStyle = (planId: string) => {
    const styles: Record<string, { border: string; bg: string; iconBg: string; iconColor: string; textColor: string; boldColor: string }> = {
      'free': { 
        border: 'border-2', 
        bg: '', 
        iconBg: 'bg-slate-100', 
        iconColor: 'text-slate-600',
        textColor: 'text-slate-600',
        boldColor: 'text-slate-900'
      },
      'plus': { 
        border: 'border-2 border-blue-200', 
        bg: 'bg-blue-50', 
        iconBg: 'bg-blue-100', 
        iconColor: 'text-blue-600',
        textColor: 'text-blue-700',
        boldColor: 'text-blue-900'
      },
      'pro': { 
        border: 'border-2 border-purple-200', 
        bg: 'bg-purple-50', 
        iconBg: 'bg-purple-100', 
        iconColor: 'text-purple-600',
        textColor: 'text-purple-700',
        boldColor: 'text-purple-900'
      },
      'gpat_last_minute': { 
        border: 'border-2 border-indigo-200', 
        bg: 'bg-indigo-50', 
        iconBg: 'bg-indigo-100', 
        iconColor: 'text-indigo-600',
        textColor: 'text-indigo-700',
        boldColor: 'text-indigo-900'
      },
      'gpat_2027_full': { 
        border: 'border-2 border-pink-200', 
        bg: 'bg-pink-50', 
        iconBg: 'bg-pink-100', 
        iconColor: 'text-pink-600',
        textColor: 'text-pink-700',
        boldColor: 'text-pink-900'
      },
    };
    return styles[planId] || { 
      border: 'border-2', 
      bg: '', 
      iconBg: 'bg-gray-100', 
      iconColor: 'text-gray-600',
      textColor: 'text-gray-600',
      boldColor: 'text-gray-900'
    };
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "plus":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "free":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "gpat_last_minute":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "gpat_2027_full":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      case "cancelled":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const exportToCSV = () => {
    const headers = ["Email", "Name", "Course", "Plan", "Status", "Enrolled At", "Valid Until", "Total Attempts", "Notes Generated", "Payment Amount", "Payment Date"];
    const rows = filteredEnrollments.map((e) => [
      e.email,
      e.name || "N/A",
      `${e.courseName} (${e.courseCode})`,
      e.plan,
      e.status,
      new Date(e.enrolledAt).toLocaleDateString(),
      e.validUntil ? new Date(e.validUntil).toLocaleDateString() : "Lifetime",
      e.totalAttempts.toString(),
      e.notesGenerated.toString(),
      e.paymentAmount ? `₹${Math.round(e.paymentAmount)}` : "N/A",
      e.paymentDate ? new Date(e.paymentDate).toLocaleDateString() : "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("User data exported successfully");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            User Management
          </h1>
          <p className="mt-2 text-slate-600">
            View and manage user enrollments across all courses
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 border-2">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700">Active</p>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
          </div>
        </Card>

        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.id);
          const style = getPlanCardStyle(plan.id);
          const count = stats[plan.id] || 0;
          
          return (
            <Card key={plan.id} className={`p-4 ${style.border} ${style.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-full ${style.iconBg} p-2`}>
                  <Icon className={`h-5 w-5 ${style.iconColor}`} />
                </div>
                <div>
                  <p className={`text-sm ${style.textColor} capitalize`}>{plan.name}</p>
                  <p className={`text-2xl font-bold ${style.boldColor}`}>{count}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Label>
            <Input
              id="search"
              placeholder="Email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-filter">Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="course-filter">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-filter">Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger id="plan-filter">
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchQuery || selectedCourse !== "all" || selectedPlan !== "all" || selectedStatus !== "all") && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCourse("all");
                setSelectedPlan("all");
                setSelectedStatus("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* User List */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading users...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              No users found matching your filters
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">User ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Course</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Account</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Activity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Enrolled</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Valid Until</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((enrollment, index) => (
                  <tr key={`${enrollment.userId}-${enrollment.courseCode}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-900">{enrollment.email}</p>
                        </div>
                        {enrollment.name && (
                          <p className="text-xs text-slate-500 ml-6">{enrollment.name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-slate-600 max-w-[200px] truncate" title={enrollment.userId}>
                        {enrollment.userId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{enrollment.courseName}</p>
                        <p className="text-xs text-slate-500">{enrollment.courseCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${getPlanBadgeColor(enrollment.plan)} border font-semibold capitalize`}>
                        {enrollment.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${getStatusBadgeColor(enrollment.status)} border capitalize`}>
                        {enrollment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${
                        enrollment.userStatus === 'blocked' 
                          ? 'bg-red-100 text-red-700 border-red-200' 
                          : enrollment.userStatus === 'suspended'
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-green-100 text-green-700 border-green-200'
                      } border capitalize`}>
                        {enrollment.userStatus || 'active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {enrollment.paymentAmount && enrollment.paymentDate ? (
                        <div className="text-sm">
                          <div className="flex items-center gap-1 font-semibold text-green-600">
                            <IndianRupee className="h-3 w-3" />
                            {Math.round(enrollment.paymentAmount)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(enrollment.paymentDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No payment</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {enrollment.notesGenerated} notes
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {enrollment.totalAttempts} tests
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <BlockUserButton 
                          userId={enrollment.userId}
                          userEmail={enrollment.email}
                          currentStatus={enrollment.userStatus || 'active'}
                          onStatusChange={() => loadEnrollments()}
                        />
                        <ResetDevicesButton
                          userId={enrollment.userId}
                          userEmail={enrollment.email}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600">
                        {enrollment.validUntil
                          ? new Date(enrollment.validUntil).toLocaleDateString()
                          : <span className="text-green-600 font-medium">Lifetime</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
