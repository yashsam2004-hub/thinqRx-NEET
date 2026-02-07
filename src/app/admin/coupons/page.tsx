"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
}

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  courseId: string | null;
  courseName: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Form state
  const [code, setCode] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState(10);
  const [selectedCourse, setSelectedCourse] = React.useState<string>("all");
  const [maxUses, setMaxUses] = React.useState(20);
  const [expiresAt, setExpiresAt] = React.useState("");

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

  // Load coupons
  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset form
  const resetForm = () => {
    setCode("");
    setDiscountPercent(10);
    setSelectedCourse("all");
    setMaxUses(20);
    setExpiresAt("");
  };

  // Create coupon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      toast.error("Coupon code is required");
      return;
    }

    try {
      const payload = {
        code: code.toUpperCase(),
        discountPercent,
        courseId: selectedCourse === "all" ? null : selectedCourse,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.message || "Failed to create coupon");
        return;
      }

      toast.success("Coupon created successfully");
      setIsDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  // Toggle coupon active status
  const toggleActive = async (couponId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: couponId, isActive: !currentStatus }),
      });

      if (res.ok) {
        toast.success("Coupon updated");
        loadCoupons();
      }
    } catch (error) {
      toast.error("Failed to update coupon");
    }
  };

  // Delete coupon
  const handleDelete = async (couponId: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/coupons?id=${couponId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.message || "Failed to delete coupon");
        return;
      }

      toast.success("Coupon deleted");
      loadCoupons();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Coupon Management</h1>
          <p className="mt-2 text-slate-600">
            Create and manage discount coupons (max 50% off, 1-1000 uses)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>Create New Coupon</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g., WELCOME50"
                    maxLength={20}
                    required
                  />
                  <p className="text-xs text-slate-500">3-20 characters, uppercase</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Discount % *</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    min="1"
                    max="50"
                    required
                  />
                  <p className="text-xs text-slate-500">1-50% maximum</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="course">Apply to Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger id="course">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Max Uses *</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    min="1"
                    max="1000"
                    required
                  />
                  <p className="text-xs text-slate-500">1-1000 uses</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Coupon</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <Card className="p-6">
          <p className="text-center text-slate-500">Loading coupons...</p>
        </Card>
      ) : coupons.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-slate-500">No coupons yet. Create your first coupon!</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const isMaxedOut = coupon.usedCount >= coupon.maxUses;

            return (
              <Card key={coupon.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <code className="rounded bg-indigo-50 px-3 py-1 text-lg font-bold text-indigo-700">
                        {coupon.code}
                      </code>
                      <span className="text-2xl font-semibold text-slate-900">
                        {coupon.discountPercent}% OFF
                      </span>
                      {coupon.isActive && !isExpired && !isMaxedOut && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      )}
                      {!coupon.isActive && (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                          Inactive
                        </span>
                      )}
                      {isExpired && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          Expired
                        </span>
                      )}
                      {isMaxedOut && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          Max Uses Reached
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-6 text-sm text-slate-600">
                      <span>Course: {coupon.courseName}</span>
                      <span>
                        Uses: {coupon.usedCount} / {coupon.maxUses}
                      </span>
                      {coupon.expiresAt && (
                        <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${coupon.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${coupon.id}`}
                        checked={coupon.isActive}
                        onCheckedChange={() => toggleActive(coupon.id, coupon.isActive)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(coupon.id, coupon.code)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
