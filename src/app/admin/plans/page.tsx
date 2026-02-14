"use client";

/**
 * Admin Plans Management Page
 * Allows admins to update plan pricing, validity, and visibility
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, X, Edit, Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: number;
  validity_days: number;
  description: string;
  features: any;
  is_active: boolean;
  display_order: number;
  plan_category: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Plan>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      if (data) setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }

  function startEditing(plan: Plan) {
    setEditing(plan.id);
    setEditForm({
      name: plan.name,
      price: plan.price,
      validity_days: plan.validity_days,
      description: plan.description,
      display_order: plan.display_order,
      features: plan.features, // Include features for editing
    });
  }

  function cancelEditing() {
    setEditing(null);
    setEditForm({});
  }

  async function saveChanges(planId: string) {
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          updates: editForm,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update plan');
      }

      toast.success('Plan updated successfully. Changes will appear immediately.');
      await fetchPlans();
      cancelEditing();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update plan');
    }
  }

  async function toggleActive(planId: string, currentStatus: boolean) {
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update plan status');
      }

      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'}. Changes will appear immediately.`);
      await fetchPlans();
    } catch (error) {
      console.error('Error toggling plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update plan status');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#E6F4F2] dark:bg-[#0F172A]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Manage Pricing Plans
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Update plan pricing, validity, and display order
          </p>
        </div>

        {/* Plans Grid */}
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`p-6 border-2 ${
                editing === plan.id 
                  ? 'border-[#0F766E] dark:border-teal-500' 
                  : 'border-[#E5E7EB] dark:border-slate-700'
              } ${
                plan.is_active 
                  ? 'bg-white dark:bg-slate-800/50' 
                  : 'bg-[#F8FAFC] dark:bg-slate-900/50'
              }`}
            >
              {editing === plan.id ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Editing: {plan.id}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEditing}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Plan Name</Label>
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        value={editForm.price || 0}
                        onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Validity (days)</Label>
                      <Input
                        type="number"
                        value={editForm.validity_days || 30}
                        onChange={(e) => setEditForm({ ...editForm, validity_days: parseInt(e.target.value) || 30 })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={editForm.display_order || 999}
                        onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 999 })}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Lower numbers show first (1 = hero plan)
                      </p>
                    </div>
                  </div>

                  {/* Features Editor */}
                  <div className="border-t pt-6 mt-6">
                    <Label className="text-base font-semibold mb-4 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Plan Features & Access Control
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Configure what this plan can access. -1 = unlimited, 0 = none, N = daily/monthly limit
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">AI Notes Limit (per day)</Label>
                        <Input
                          type="number"
                          value={editForm.features?.ai_notes_limit ?? -1}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            features: { 
                              ...editForm.features, 
                              ai_notes_limit: parseInt(e.target.value) || 0 
                            } 
                          })}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">-1 for unlimited</p>
                      </div>

                      <div>
                        <Label className="text-sm">Practice Tests Limit (per day)</Label>
                        <Input
                          type="number"
                          value={editForm.features?.practice_tests_limit ?? -1}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            features: { 
                              ...editForm.features, 
                              practice_tests_limit: parseInt(e.target.value) || 0 
                            } 
                          })}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">-1 for unlimited</p>
                      </div>

                      <div>
                        <Label className="text-sm">Mock Tests Limit (per month)</Label>
                        <Input
                          type="number"
                          value={editForm.features?.mock_tests_limit ?? 0}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            features: { 
                              ...editForm.features, 
                              mock_tests_limit: parseInt(e.target.value) || 0 
                            } 
                          })}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">-1 for unlimited, 0 for none</p>
                      </div>

                      <div className="flex items-center space-x-2 mt-6">
                        <Checkbox
                          id={`mock-access-${plan.id}`}
                          checked={editForm.features?.mock_tests_access ?? false}
                          onCheckedChange={(checked) => setEditForm({ 
                            ...editForm, 
                            features: { 
                              ...editForm.features, 
                              mock_tests_access: checked as boolean 
                            } 
                          })}
                        />
                        <Label htmlFor={`mock-access-${plan.id}`} className="text-sm cursor-pointer">
                          Enable Mock Test Access
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 mt-6">
                        <Checkbox
                          id={`premium-access-${plan.id}`}
                          checked={editForm.features?.can_access_premium_content ?? false}
                          onCheckedChange={(checked) => setEditForm({ 
                            ...editForm, 
                            features: { 
                              ...editForm.features, 
                              can_access_premium_content: checked as boolean 
                            } 
                          })}
                        />
                        <Label htmlFor={`premium-access-${plan.id}`} className="text-sm cursor-pointer">
                          Can Access Premium Content
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 mt-6">
                        <Checkbox
                          id={`regenerate-${plan.id}`}
                          checked={editForm.features?.regenerate_notes ?? false}
                          onCheckedChange={(checked) => setEditForm({ 
                            ...editForm, 
                            features: { 
                              ...editForm.features, 
                              regenerate_notes: checked as boolean 
                            } 
                          })}
                        />
                        <Label htmlFor={`regenerate-${plan.id}`} className="text-sm cursor-pointer">
                          Can Regenerate Notes
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => saveChanges(plan.id)}
                    className="w-full text-white border-0 gap-2 bg-[#0F766E] hover:bg-[#115E59]"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              ) : (
                // View Mode
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {plan.name}
                      </h2>
                      <Badge 
                        className={plan.is_active 
                          ? 'bg-[#E6F4F2] dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-400' 
                          : 'bg-[#E5E7EB] dark:bg-slate-700 text-[#64748B] dark:text-slate-400'}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">
                        {plan.plan_category}
                      </Badge>
                      {plan.display_order === 1 && (
                        <Badge className="bg-[#FEF3E7] dark:bg-amber-950/50 text-[#F4C430] dark:text-amber-400">
                          ⭐ Hero Plan
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {plan.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Price</span>
                        <p className="font-bold text-xl text-[#0F766E] dark:text-teal-400">
                          ₹{plan.price}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Validity</span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {plan.validity_days} days
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Display Order</span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          #{plan.display_order}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Category</span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {plan.plan_category}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-teal-600">
                          View Features JSON →
                        </summary>
                        <pre className="mt-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-auto max-h-60">
                          {JSON.stringify(plan.features, null, 2)}
                        </pre>
                      </details>
                    </div>
                    
                    {/* Access Summary */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Quick Access Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">AI Notes:</span>
                          <span className="ml-1 font-semibold text-blue-900 dark:text-blue-200">
                            {plan.features?.ai_notes_limit === -1 ? '∞' : plan.features?.ai_notes_limit || 0}/day
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">Practice:</span>
                          <span className="ml-1 font-semibold text-blue-900 dark:text-blue-200">
                            {plan.features?.practice_tests_limit === -1 ? '∞' : plan.features?.practice_tests_limit || 0}/day
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">Mock Tests:</span>
                          <span className="ml-1 font-semibold text-blue-900 dark:text-blue-200">
                            {plan.features?.mock_tests_access ? '✓' : '✗'}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-400">Premium:</span>
                          <span className="ml-1 font-semibold text-blue-900 dark:text-blue-200">
                            {plan.features?.can_access_premium_content !== false ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => startEditing(plan)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant={plan.is_active ? "destructive" : "default"}
                      onClick={() => toggleActive(plan.id, plan.is_active)}
                      className="gap-2"
                    >
                      {plan.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="p-6 border-2 border-[#E5E7EB] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/50">
            <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Plan Display Order Guide
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li><strong>1</strong> - Hero plan (highlighted on pricing page)</li>
              <li><strong>2-4</strong> - Secondary plans</li>
              <li><strong>5+</strong> - De-emphasized plans</li>
            </ul>
          </Card>

          <Card className="p-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Access Rules
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li><strong>Free Plan:</strong> Limited access (5 notes/day, 3 tests/day, no mock tests)</li>
              <li><strong>Plus Plan:</strong> Unlimited notes/tests, but NO mock tests</li>
              <li><strong>Other Paid Plans:</strong> Full access (configured per plan)</li>
              <li><strong>Note:</strong> Changes take effect immediately after saving</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
