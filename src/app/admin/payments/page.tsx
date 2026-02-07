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
  payment_method: string;
  payment_status: string;
  plan: string;
  billing_cycle: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  enrollment: {
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
      const matchesSearch =
        !searchQuery ||
        payment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" ||
        payment.payment_status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesPlan =
        selectedPlan === "all" ||
        payment.plan.toLowerCase() === selectedPlan.toLowerCase();

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
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(payment.created_at).toLocaleDateString()}
                        <span className="text-xs text-slate-400">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{payment.userEmail}</p>
                          <p className="text-xs text-slate-500 font-mono">{payment.user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <p className="text-lg font-bold text-emerald-600">₹{payment.amount.toLocaleString('en-IN')}</p>
                        {payment.billing_cycle && (
                          <span className="text-xs text-slate-500">/{payment.billing_cycle === "annual" ? "year" : "month"}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getPlanBadge(payment.plan)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(payment.payment_status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CreditCard className="h-4 w-4" />
                        {payment.payment_method || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-slate-600">
                        {payment.transaction_id || (
                          <span className="text-slate-400 italic">No transaction ID</span>
                        )}
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-slate-500 mt-1">{payment.notes}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Summary Footer */}
      {filteredPayments.length > 0 && (
        <Card className="p-4 bg-slate-50">
          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-600">
              Showing <span className="font-semibold text-slate-900">{filteredPayments.length}</span> of{" "}
              <span className="font-semibold text-slate-900">{payments.length}</span> payments
            </p>
            <p className="text-slate-600">
              Total filtered: <span className="font-bold text-emerald-600">
                ₹{filteredPayments
                  .filter(p => p.payment_status === "completed")
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
