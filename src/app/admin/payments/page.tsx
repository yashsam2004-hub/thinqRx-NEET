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
  DollarSign,
  Search,
  Filter,
  Download,
  Mail,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Receipt,
  User,
  IndianRupee
} from "lucide-react";

interface Payment {
  id: string;
  user_id: string;
  userEmail: string;
  amount: number;
  currency: string;
  payment_method?: string;
  payment_status?: string;
  status?: string; // Database uses 'status' field
  plan_name?: string;
  plan?: string;
  billing_cycle?: string;
  transaction_id?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  notes?: string | null;
  created_at: string;
  completed_at?: string | null;
  enrollment?: {
    plan: string;
    billing_cycle: string;
    courses: {
      name: string;
      code: string;
    };
  } | null;
}

interface PaymentStats {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  pendingRevenue: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [stats, setStats] = React.useState<PaymentStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [selectedPlan, setSelectedPlan] = React.useState<string>("all");

  // Load payments
  const loadPayments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setStats(data.stats || null);
      } else {
        toast.error("Failed to load payments");
      }
    } catch (error) {
      console.error("Failed to load payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Filter payments
  const filteredPayments = React.useMemo(() => {
    return payments.filter((payment) => {
      const paymentStatus = payment.status || payment.payment_status || 'unknown';
      const planName = payment.plan_name || payment.plan || '';
      
      const matchesSearch =
        !searchQuery ||
        payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.razorpay_order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.razorpay_payment_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" ||
        paymentStatus.toLowerCase() === selectedStatus.toLowerCase();

      const matchesPlan =
        selectedPlan === "all" ||
        planName.toLowerCase() === selectedPlan.toLowerCase();

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [payments, searchQuery, selectedStatus, selectedPlan]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 border flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 border flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 border flex items-center gap-1">
            <TrendingUp className="h-3 w-3 rotate-180" />
            Refunded
          </Badge>
        );
      default:
        return <Badge className="bg-slate-100 text-slate-700 border">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Pro</Badge>;
      case "plus":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Plus</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border">{plan}</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Email", "Amount", "Currency", "Status", "Plan", "Billing", "Transaction ID", "Method", "Notes"];
    const rows = filteredPayments.map((p) => [
      new Date(p.created_at).toLocaleDateString(),
      p.userEmail,
      p.amount.toString(),
      p.currency,
      p.payment_status,
      p.plan,
      p.billing_cycle || "N/A",
      p.transaction_id || "N/A",
      p.payment_method || "N/A",
      p.notes || "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payments exported successfully");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            Payment Management
          </h1>
          <p className="mt-2 text-slate-600">
            Track revenue, view transactions, and manage user payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadPayments} variant="outline" className="gap-2" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 border-2 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500 p-3">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-900">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500 p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Completed</p>
                <p className="text-2xl font-bold text-blue-900">{stats.completedPayments}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-500 p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-700 font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pendingPayments}</p>
                <p className="text-xs text-yellow-600">₹{stats.pendingRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-purple-200 bg-purple-50">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500 p-3">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalPayments}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Label>
            <Input
              id="search"
              placeholder="Email or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Payment Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(searchQuery || selectedStatus !== "all" || selectedPlan !== "all") && (
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("all");
                setSelectedPlan("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Payments List */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-slate-600">Loading payments...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium mb-2">No payments found</p>
              <p className="text-slate-500 text-sm">
                {payments.length === 0
                  ? "No payment records yet. They will appear here once users make purchases."
                  : "No payments match your current filters"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 dark:bg-slate-800">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Razorpay IDs</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => {
                  const paymentStatus = payment.status || payment.payment_status || 'unknown';
                  const planName = payment.plan_name || payment.plan || 'N/A';
                  
                  return (
                    <tr 
                      key={payment.id} 
                      className={`border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <Calendar className="h-4 w-4" />
                            {new Date(payment.created_at).toLocaleDateString('en-IN')}
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(payment.created_at).toLocaleTimeString('en-IN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{payment.userEmail}</p>
                            <p className="text-xs text-slate-500 font-mono">{payment.user_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <p className="text-lg font-bold text-emerald-600">₹{payment.amount.toLocaleString('en-IN')}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {getPlanBadge(planName)}
                          {payment.billing_cycle && (
                            <span className="text-xs text-slate-500 capitalize">
                              {payment.billing_cycle.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(paymentStatus)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {payment.razorpay_order_id && (
                            <div className="text-xs">
                              <span className="text-slate-500">Order:</span>{' '}
                              <span className="font-mono text-slate-700 dark:text-slate-300">
                                {payment.razorpay_order_id}
                              </span>
                            </div>
                          )}
                          {payment.razorpay_payment_id && (
                            <div className="text-xs">
                              <span className="text-slate-500">Payment:</span>{' '}
                              <span className="font-mono text-slate-700 dark:text-slate-300">
                                {payment.razorpay_payment_id}
                              </span>
                            </div>
                          )}
                          {!payment.razorpay_order_id && !payment.razorpay_payment_id && (
                            <span className="text-xs text-slate-400 italic">No IDs</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Summary Footer */}
      {filteredPayments.length > 0 && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center justify-between text-sm flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <p className="text-slate-600 dark:text-slate-300">
                Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredPayments.length}</span> of{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{payments.length}</span> payments
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Completed: <span className="font-semibold text-green-600">
                  {filteredPayments.filter(p => (p.status || p.payment_status) === "completed").length}
                </span>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Pending: <span className="font-semibold text-yellow-600">
                  {filteredPayments.filter(p => (p.status || p.payment_status) === "pending").length}
                </span>
              </p>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Total Revenue: <span className="font-bold text-emerald-600 text-lg">
                ₹{filteredPayments
                  .filter(p => (p.status || p.payment_status) === "completed")
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString('en-IN')}
              </span>
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
