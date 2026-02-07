"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield,
  ArrowLeft,
  User,
  Crown,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
  status?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(data.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "student" : "admin";
    const action = newRole === "admin" ? "grant" : "revoke";

    if (!confirm(`Are you sure you want to ${action} admin access for this user?`)) {
      return;
    }

    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (data.ok) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user role");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const adminUsers = users.filter((u) => u.role === "admin");
  const regularUsers = users.filter((u) => u.role !== "admin");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-0">
                <Shield className="h-3.5 w-3.5 mr-1" />
                Admin Management
              </Badge>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Manage Admins
              </h1>
              <p className="text-lg text-slate-600">
                Grant or revoke admin access for users
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Admins</p>
                <p className="text-2xl font-bold text-slate-800">{adminUsers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Regular Users</p>
                <p className="text-2xl font-bold text-slate-800">{regularUsers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <User className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-800">{users.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admin Users */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            Admin Users
          </h2>
          <div className="space-y-4">
            {adminUsers.map((user) => (
              <Card key={user.id} className="p-6 border-2 border-purple-100 hover:border-purple-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Crown className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {user.email.split('@')[0]}
                        </h3>
                        <Badge className="bg-purple-100 text-purple-700 border-0">
                          Admin
                        </Badge>
                        {user.status === "blocked" && (
                          <Badge className="bg-red-100 text-red-700 border-0">
                            Blocked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleToggleAdmin(user.id, user.role)}
                    disabled={updating === user.id}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {updating === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Revoke Admin"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
            {adminUsers.length === 0 && (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No admin users found</p>
              </Card>
            )}
          </div>
        </div>

        {/* Regular Users */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            Regular Users
          </h2>
          <div className="space-y-4">
            {regularUsers.map((user) => (
              <Card key={user.id} className="p-6 border-2 border-slate-100 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-full">
                      <User className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {user.email.split('@')[0]}
                        </h3>
                        <Badge variant="outline" className="text-slate-600">
                          User
                        </Badge>
                        {user.status === "blocked" && (
                          <Badge className="bg-red-100 text-red-700 border-0">
                            Blocked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleToggleAdmin(user.id, user.role)}
                    disabled={updating === user.id}
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                  >
                    {updating === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Grant Admin"
                    )}
                  </Button>
                </div>
              </Card>
            ))}
            {regularUsers.length === 0 && (
              <Card className="p-8 text-center">
                <User className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No regular users found</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
